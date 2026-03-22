cmake_minimum_required(VERSION 3.14)
project(HeatDiffusionEngine VERSION 1.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)

find_package(Threads REQUIRED)

add_executable(
    heat_diffusion_cli
    src/main.cpp
    src/diffusion_system.cpp
    src/simulation_engine.cpp
)

target_link_libraries(heat_diffusion_cli PRIVATE Threads::Threads)
