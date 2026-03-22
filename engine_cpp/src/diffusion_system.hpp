#ifndef DIFFUSION_SYSTEM_HPP
#define DIFFUSION_SYSTEM_HPP

#include <string>
#include <vector>

struct DiffusionConfig {
    int grid_width;
    int grid_height;
    double diffusivity;
    double time_step;
    std::string boundary_mode;
    std::string initial_pattern;
    double ambient_temperature;
    double hotspot_temperature;
};

class DiffusionSystem {
public:
    DiffusionSystem();
    explicit DiffusionSystem(const DiffusionConfig& config);

    void configure(const DiffusionConfig& config);
    void reset();
    void step();

    bool matches_config(const DiffusionConfig& config) const;
    const DiffusionConfig& config() const;

    std::string to_json(double time, bool playing, int revision) const;

private:
    DiffusionConfig config_;
    std::vector<double> temperatures_;
    std::vector<double> scratch_;

    static DiffusionConfig sanitize_config(const DiffusionConfig& raw_config);
    void resize_storage();
    void apply_initial_pattern();
    void step_once(double dt);
    double neighbor_temperature(int x, int y, int fallback_x, int fallback_y) const;
};

#endif
