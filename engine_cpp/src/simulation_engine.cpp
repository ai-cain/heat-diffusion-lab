#include "simulation_engine.hpp"

#include <chrono>
#include <sstream>
#include <stdexcept>
#include <string>
#include <thread>
#include <vector>

namespace {

constexpr double LOOP_DT_SECONDS = 1.0 / 30.0;

std::vector<std::string> split_string(const std::string& value, char delimiter) {
    std::vector<std::string> parts;
    std::stringstream ss(value);
    std::string token;

    while (std::getline(ss, token, delimiter)) {
        parts.push_back(token);
    }

    return parts;
}

bool parse_bool_token(const std::string& token) {
    return token == "1" || token == "true" || token == "TRUE" || token == "True";
}

std::string escape_json(const std::string& value) {
    std::string escaped;
    escaped.reserve(value.size());

    for (char character : value) {
        switch (character) {
            case '\\':
                escaped += "\\\\";
                break;
            case '"':
                escaped += "\\\"";
                break;
            case '\n':
                escaped += "\\n";
                break;
            default:
                escaped += character;
                break;
        }
    }

    return escaped;
}

DiffusionConfig default_config() {
    return {
        48,
        32,
        0.18,
        0.12,
        "fixed",
        "center_hotspot",
        18.0,
        90.0,
    };
}

} // namespace

SimulationEngine::SimulationEngine(EmitFn emit_fn)
    : emit_fn_(std::move(emit_fn)), system_(default_config()) {
}

SimulationEngine::~SimulationEngine() {
    stop();
}

void SimulationEngine::start() {
    if (running_.exchange(true)) {
        return;
    }

    simulation_thread_ = std::thread(&SimulationEngine::simulation_loop, this);
    emit_ready();
    emit_state();
}

void SimulationEngine::stop() {
    if (!running_.exchange(false)) {
        return;
    }

    if (simulation_thread_.joinable()) {
        simulation_thread_.join();
    }
}

void SimulationEngine::handle_command(const std::string& line) {
    if (line.empty()) {
        return;
    }

    try {
        const std::vector<std::string> parts = split_string(line, '\t');
        if (parts.empty()) {
            return;
        }

        const std::string& command = parts[0];

        if (command == "CONFIG") {
            if (parts.size() < 10) {
                throw std::runtime_error("CONFIG command requires 9 arguments.");
            }

            DiffusionConfig config{};
            config.grid_width = std::stoi(parts[1]);
            config.grid_height = std::stoi(parts[2]);
            config.diffusivity = std::stod(parts[3]);
            config.time_step = std::stod(parts[4]);
            config.boundary_mode = parts[5];
            config.initial_pattern = parts[6];
            config.ambient_temperature = std::stod(parts[7]);
            config.hotspot_temperature = std::stod(parts[8]);
            const bool next_playing = parse_bool_token(parts[9]);

            {
                std::lock_guard<std::mutex> lock(state_mutex_);
                const bool config_changed = !system_.matches_config(config);
                const bool playing_changed = playing_ != next_playing;

                if (config_changed) {
                    apply_config_locked(config);
                }

                if (playing_changed) {
                    playing_ = next_playing;
                }

                if (config_changed || playing_changed) {
                    dirty_ = true;
                }
            }

            emit_state();
            return;
        }

        if (command == "PLAY") {
            if (parts.size() < 2) {
                throw std::runtime_error("PLAY command requires a boolean value.");
            }

            {
                std::lock_guard<std::mutex> lock(state_mutex_);
                playing_ = parse_bool_token(parts[1]);
                dirty_ = true;
            }

            emit_state();
            return;
        }

        if (command == "RESET") {
            {
                std::lock_guard<std::mutex> lock(state_mutex_);
                reset_locked();
                dirty_ = true;
            }

            emit_state();
            return;
        }

        if (command == "REQUEST_STATE") {
            emit_state();
            return;
        }

        throw std::runtime_error("Unknown engine command: " + command);
    } catch (const std::exception& error) {
        emit_error(error.what());
    }
}

void SimulationEngine::simulation_loop() {
    while (running_) {
        bool should_emit = false;

        {
            std::lock_guard<std::mutex> lock(state_mutex_);

            if (playing_) {
                system_.step();
                current_time_ += system_.config().time_step;
                dirty_ = false;
                should_emit = true;
            } else if (dirty_) {
                dirty_ = false;
                should_emit = true;
            }
        }

        if (should_emit) {
            emit_state();
        }

        std::this_thread::sleep_for(std::chrono::duration<double>(LOOP_DT_SECONDS));
    }
}

void SimulationEngine::apply_config_locked(const DiffusionConfig& next_config) {
    system_.configure(next_config);
    playing_ = false;
    current_time_ = 0.0;
    ++revision_;
}

void SimulationEngine::reset_locked() {
    system_.reset();
    current_time_ = 0.0;
    ++revision_;
}

void SimulationEngine::emit_ready() const {
    if (emit_fn_) {
        emit_fn_("{\"type\":\"ready\"}");
    }
}

void SimulationEngine::emit_error(const std::string& message) const {
    if (!emit_fn_) {
        return;
    }

    emit_fn_(
        std::string("{\"type\":\"error\",\"message\":\"") + escape_json(message) + "\"}"
    );
}

void SimulationEngine::emit_state() const {
    std::string payload;

    {
        std::lock_guard<std::mutex> lock(state_mutex_);
        payload = system_.to_json(current_time_, playing_, revision_);
    }

    if (emit_fn_) {
        emit_fn_(payload);
    }
}
