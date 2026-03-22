#include "diffusion_system.hpp"

#include <algorithm>
#include <cmath>
#include <iomanip>
#include <limits>
#include <sstream>

namespace {

constexpr int DEFAULT_GRID_WIDTH = 48;
constexpr int DEFAULT_GRID_HEIGHT = 32;
constexpr double DEFAULT_DIFFUSIVITY = 0.18;
constexpr double DEFAULT_TIME_STEP = 0.12;
constexpr double DEFAULT_AMBIENT_TEMPERATURE = 18.0;
constexpr double DEFAULT_HOTSPOT_TEMPERATURE = 90.0;
constexpr double STABILITY_FACTOR = 0.24;

bool nearly_equal(double left, double right, double epsilon = 1e-12) {
    return std::abs(left - right) <= epsilon;
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

double clamp_value(double value, double min_value, double max_value) {
    return std::min(max_value, std::max(min_value, value));
}

std::string serialize_numbers(const std::vector<double>& values) {
    std::ostringstream ss;
    ss << "[";

    for (std::size_t index = 0; index < values.size(); ++index) {
        ss << values[index];
        if (index + 1 < values.size()) {
            ss << ",";
        }
    }

    ss << "]";
    return ss.str();
}

bool valid_boundary_mode(const std::string& boundary_mode) {
    return boundary_mode == "fixed" || boundary_mode == "insulated";
}

bool valid_initial_pattern(const std::string& initial_pattern) {
    return initial_pattern == "center_hotspot" ||
           initial_pattern == "left_wall" ||
           initial_pattern == "checkerboard" ||
           initial_pattern == "ring";
}

} // namespace

DiffusionSystem::DiffusionSystem()
    : DiffusionSystem({
          DEFAULT_GRID_WIDTH,
          DEFAULT_GRID_HEIGHT,
          DEFAULT_DIFFUSIVITY,
          DEFAULT_TIME_STEP,
          "fixed",
          "center_hotspot",
          DEFAULT_AMBIENT_TEMPERATURE,
          DEFAULT_HOTSPOT_TEMPERATURE,
      }) {
}

DiffusionSystem::DiffusionSystem(const DiffusionConfig& config) {
    configure(config);
}

void DiffusionSystem::configure(const DiffusionConfig& config) {
    config_ = sanitize_config(config);
    resize_storage();
    reset();
}

void DiffusionSystem::reset() {
    std::fill(temperatures_.begin(), temperatures_.end(), config_.ambient_temperature);
    apply_initial_pattern();
}

void DiffusionSystem::step() {
    const double stable_step = STABILITY_FACTOR / std::max(config_.diffusivity, 1e-6);
    const int substeps = std::max(
        1,
        static_cast<int>(std::ceil(config_.time_step / std::max(stable_step, 1e-6)))
    );
    const double internal_dt = config_.time_step / static_cast<double>(substeps);

    for (int index = 0; index < substeps; ++index) {
        step_once(internal_dt);
    }
}

bool DiffusionSystem::matches_config(const DiffusionConfig& config) const {
    const DiffusionConfig sanitized = sanitize_config(config);

    return config_.grid_width == sanitized.grid_width &&
           config_.grid_height == sanitized.grid_height &&
           nearly_equal(config_.diffusivity, sanitized.diffusivity) &&
           nearly_equal(config_.time_step, sanitized.time_step) &&
           config_.boundary_mode == sanitized.boundary_mode &&
           config_.initial_pattern == sanitized.initial_pattern &&
           nearly_equal(config_.ambient_temperature, sanitized.ambient_temperature) &&
           nearly_equal(config_.hotspot_temperature, sanitized.hotspot_temperature);
}

const DiffusionConfig& DiffusionSystem::config() const {
    return config_;
}

std::string DiffusionSystem::to_json(double time, bool playing, int revision) const {
    double min_temperature = std::numeric_limits<double>::infinity();
    double max_temperature = -std::numeric_limits<double>::infinity();
    double sum_temperature = 0.0;

    for (double temperature : temperatures_) {
        min_temperature = std::min(min_temperature, temperature);
        max_temperature = std::max(max_temperature, temperature);
        sum_temperature += temperature;
    }

    const double average_temperature =
        temperatures_.empty() ? 0.0 : sum_temperature / static_cast<double>(temperatures_.size());

    std::ostringstream ss;
    ss << std::fixed << std::setprecision(6);
    ss << "{\"type\":\"state\",\"data\":{";
    ss << "\"revision\":" << revision << ",";
    ss << "\"time\":" << time << ",";
    ss << "\"playing\":" << (playing ? "true" : "false") << ",";
    ss << "\"grid_width\":" << config_.grid_width << ",";
    ss << "\"grid_height\":" << config_.grid_height << ",";
    ss << "\"diffusivity\":" << config_.diffusivity << ",";
    ss << "\"time_step\":" << config_.time_step << ",";
    ss << "\"boundary_mode\":\"" << escape_json(config_.boundary_mode) << "\",";
    ss << "\"initial_pattern\":\"" << escape_json(config_.initial_pattern) << "\",";
    ss << "\"ambient_temperature\":" << config_.ambient_temperature << ",";
    ss << "\"hotspot_temperature\":" << config_.hotspot_temperature << ",";
    ss << "\"min_temperature\":" << min_temperature << ",";
    ss << "\"max_temperature\":" << max_temperature << ",";
    ss << "\"average_temperature\":" << average_temperature << ",";
    ss << "\"temperatures\":" << serialize_numbers(temperatures_);
    ss << "}}";
    return ss.str();
}

DiffusionConfig DiffusionSystem::sanitize_config(const DiffusionConfig& raw_config) {
    DiffusionConfig config{};
    config.grid_width = std::max(8, std::min(160, raw_config.grid_width > 0 ? raw_config.grid_width : DEFAULT_GRID_WIDTH));
    config.grid_height = std::max(8, std::min(120, raw_config.grid_height > 0 ? raw_config.grid_height : DEFAULT_GRID_HEIGHT));
    config.diffusivity = clamp_value(
        raw_config.diffusivity > 0.0 ? raw_config.diffusivity : DEFAULT_DIFFUSIVITY,
        0.01,
        1.5
    );
    config.time_step = clamp_value(
        raw_config.time_step > 0.0 ? raw_config.time_step : DEFAULT_TIME_STEP,
        0.01,
        1.0
    );
    config.boundary_mode = valid_boundary_mode(raw_config.boundary_mode) ? raw_config.boundary_mode : "fixed";
    config.initial_pattern =
        valid_initial_pattern(raw_config.initial_pattern) ? raw_config.initial_pattern : "center_hotspot";
    config.ambient_temperature = clamp_value(
        raw_config.ambient_temperature,
        -50.0,
        150.0
    );

    if (!std::isfinite(config.ambient_temperature)) {
        config.ambient_temperature = DEFAULT_AMBIENT_TEMPERATURE;
    }

    config.hotspot_temperature = clamp_value(
        raw_config.hotspot_temperature,
        config.ambient_temperature + 1.0,
        400.0
    );

    if (!std::isfinite(config.hotspot_temperature)) {
        config.hotspot_temperature = DEFAULT_HOTSPOT_TEMPERATURE;
    }

    if (config.hotspot_temperature <= config.ambient_temperature) {
        config.hotspot_temperature = config.ambient_temperature + 1.0;
    }

    return config;
}

void DiffusionSystem::resize_storage() {
    const std::size_t size =
        static_cast<std::size_t>(config_.grid_width) * static_cast<std::size_t>(config_.grid_height);
    temperatures_.assign(size, config_.ambient_temperature);
    scratch_.assign(size, config_.ambient_temperature);
}

void DiffusionSystem::apply_initial_pattern() {
    const int width = config_.grid_width;
    const int height = config_.grid_height;
    const double ambient = config_.ambient_temperature;
    const double hot = config_.hotspot_temperature;

    if (config_.initial_pattern == "left_wall") {
        const int hot_width = std::max(2, width / 5);
        for (int y = 0; y < height; ++y) {
            for (int x = 0; x < hot_width; ++x) {
                temperatures_[static_cast<std::size_t>(y * width + x)] = hot;
            }
        }
        return;
    }

    if (config_.initial_pattern == "checkerboard") {
        const int block = std::max(2, std::min(width, height) / 8);
        for (int y = 0; y < height; ++y) {
            for (int x = 0; x < width; ++x) {
                const bool hot_cell = ((x / block) + (y / block)) % 2 == 0;
                temperatures_[static_cast<std::size_t>(y * width + x)] = hot_cell ? hot : ambient;
            }
        }
        return;
    }

    const double center_x = (static_cast<double>(width) - 1.0) * 0.5;
    const double center_y = (static_cast<double>(height) - 1.0) * 0.5;

    if (config_.initial_pattern == "ring") {
        const double outer_radius = std::min(width, height) * 0.28;
        const double inner_radius = outer_radius * 0.58;

        for (int y = 0; y < height; ++y) {
            for (int x = 0; x < width; ++x) {
                const double dx = static_cast<double>(x) - center_x;
                const double dy = static_cast<double>(y) - center_y;
                const double radius = std::sqrt(dx * dx + dy * dy);

                if (radius >= inner_radius && radius <= outer_radius) {
                    temperatures_[static_cast<std::size_t>(y * width + x)] = hot;
                }
            }
        }
        return;
    }

    const double radius = std::min(width, height) * 0.18;
    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            const double dx = static_cast<double>(x) - center_x;
            const double dy = static_cast<double>(y) - center_y;

            if (std::sqrt(dx * dx + dy * dy) <= radius) {
                temperatures_[static_cast<std::size_t>(y * width + x)] = hot;
            }
        }
    }
}

void DiffusionSystem::step_once(double dt) {
    const int width = config_.grid_width;
    const int height = config_.grid_height;
    const double coefficient = config_.diffusivity * dt;

    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            const std::size_t index = static_cast<std::size_t>(y * width + x);

            if (config_.boundary_mode == "fixed" &&
                (x == 0 || x == width - 1 || y == 0 || y == height - 1)) {
                scratch_[index] = config_.ambient_temperature;
                continue;
            }

            const double center = temperatures_[index];
            const double left = neighbor_temperature(x - 1, y, x, y);
            const double right = neighbor_temperature(x + 1, y, x, y);
            const double up = neighbor_temperature(x, y - 1, x, y);
            const double down = neighbor_temperature(x, y + 1, x, y);
            const double laplacian = left + right + up + down - 4.0 * center;

            scratch_[index] = center + coefficient * laplacian;
        }
    }

    temperatures_.swap(scratch_);
}

double DiffusionSystem::neighbor_temperature(int x, int y, int fallback_x, int fallback_y) const {
    if (x >= 0 && x < config_.grid_width && y >= 0 && y < config_.grid_height) {
        return temperatures_[static_cast<std::size_t>(y * config_.grid_width + x)];
    }

    if (config_.boundary_mode == "fixed") {
        return config_.ambient_temperature;
    }

    return temperatures_[static_cast<std::size_t>(fallback_y * config_.grid_width + fallback_x)];
}
