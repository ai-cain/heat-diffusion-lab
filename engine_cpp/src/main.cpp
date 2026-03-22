#include "diffusion_system.hpp"
#include "simulation_engine.hpp"

#include <iostream>
#include <mutex>
#include <string>

int main(int argc, char* argv[]) {
    if (argc >= 2 && std::string(argv[1]) == "--stdio-server") {
        std::mutex output_mutex;

        SimulationEngine engine([&output_mutex](const std::string& line) {
            std::lock_guard<std::mutex> lock(output_mutex);
            std::cout << line << std::endl;
        });

        engine.start();

        std::string line;
        while (std::getline(std::cin, line)) {
            engine.handle_command(line);
        }

        engine.stop();
        return 0;
    }

    DiffusionConfig config{
        argc >= 2 ? std::stoi(argv[1]) : 48,
        argc >= 3 ? std::stoi(argv[2]) : 32,
        argc >= 4 ? std::stod(argv[3]) : 0.18,
        argc >= 5 ? std::stod(argv[4]) : 0.12,
        argc >= 6 ? std::string(argv[5]) : "fixed",
        argc >= 7 ? std::string(argv[6]) : "center_hotspot",
        argc >= 8 ? std::stod(argv[7]) : 18.0,
        argc >= 9 ? std::stod(argv[8]) : 90.0,
    };

    DiffusionSystem system(config);
    std::cout << system.to_json(0.0, false, 0) << std::endl;
    return 0;
}
