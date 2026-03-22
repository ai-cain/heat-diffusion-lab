#ifndef SIMULATION_ENGINE_HPP
#define SIMULATION_ENGINE_HPP

#include "diffusion_system.hpp"

#include <atomic>
#include <functional>
#include <mutex>
#include <string>
#include <thread>

class SimulationEngine {
public:
    using EmitFn = std::function<void(const std::string&)>;

    explicit SimulationEngine(EmitFn emit_fn);
    ~SimulationEngine();

    void start();
    void stop();
    void handle_command(const std::string& line);

private:
    EmitFn emit_fn_;
    std::atomic<bool> running_{false};
    std::thread simulation_thread_;

    mutable std::mutex state_mutex_;
    DiffusionSystem system_;
    bool playing_{false};
    bool dirty_{true};
    int revision_{0};
    double current_time_{0.0};

    void simulation_loop();
    void apply_config_locked(const DiffusionConfig& next_config);
    void reset_locked();

    void emit_ready() const;
    void emit_error(const std::string& message) const;
    void emit_state() const;
};

#endif
