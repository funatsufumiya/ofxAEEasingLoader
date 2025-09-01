#pragma once

#include "ofMain.h"

class ofxAEEasingLoader {
public:
    enum class EaseType {
        BEZIER,
        LINEAR,
        HOLD
    };
    struct Ease {
        float influence;
        float speed;
    };
    struct Keyframe {
        float time;
        vector<float> value;
        EaseType interpolationOut;
        EaseType interpolationIn;
        Ease outEase;
        Ease inEase;
    };

    struct Track {
        std::string name;
        std::string matchName;
        std::vector<Keyframe> keyframes;
    };

    void load(const std::string& filePath, bool relative_to_data_path = true){
        if(relative_to_data_path){
            loadPath(ofToDataPath(filePath));
        }else{
            loadPath(filePath);
        }
    }

    void loadPath(const of::filesystem::path& filePath){
        loadJson(ofLoadJson(filePath));
    }

    void loadJson(const nlohmann::json& j) {
        tracks.clear();

        size_t i = 0;
        for (const auto& d : j) {
            tracks.push_back(Track{});
            auto&& keyframes = tracks[i].keyframes;

            tracks[i].name = d["propertyName"];
            tracks[i].matchName = d["matchName"];

            for (const auto& k : d["keys"]) {
                Ease outEase{0,0}, inEase{0,0};
                if (k.contains("outEase") && !k["outEase"].empty()) {
                    outEase.influence = k["outEase"][0]["influence"].get<float>();
                    outEase.speed = k["outEase"][0]["speed"].get<float>();
                }
                if (k.contains("inEase") && !k["inEase"].empty()) {
                    inEase.influence = k["inEase"][0]["influence"].get<float>();
                    inEase.speed = k["inEase"][0]["speed"].get<float>();
                }

                vector<float> values;
                if(k["value"].is_array()){
                    values = k["value"].get<vector<float>>();
                }else{
                    values = {k["value"].get<float>()};
                }

                keyframes.push_back({
                    k["time"].get<float>(),
                    values,
                    stringToEaseType(k["interpolationOut"].get<std::string>()),
                    stringToEaseType(k["interpolationIn"].get<std::string>()),
                    outEase,
                    inEase
                });
            }

            ++i;
        }
    }

    /// @brief return value of property_name at time t
    /// @tparam T one of float/ofVec2f/ofVec3f/ofVec4f/vector<float>
    /// @param property_name 
    /// @param t time (seconds)
    /// @return value
    template <typename T>
    T get(std::string property_name, float t);

    /// @brief return value of property_index at time t
    /// @tparam T one of float/ofVec2f/ofVec3f/ofVec4f/vector<float>
    /// @param property_name 
    /// @param t time (seconds)
    /// @return value
    template <typename T>
    T get(int property_index, float t);

    /// @brief alias of get(0, t)
    /// @tparam T one of float/ofVec2f/ofVec3f/ofVec4f/vector<float>
    /// @param property_name 
    /// @param t time (seconds)
    /// @return value
    template <typename T>
    T get(float t) {
        return get<T>(0, t);
    }

    static const std::string easeTypeToString(EaseType ease_type) {
        if(ease_type == EaseType::BEZIER){
            return "bezier";
        }else if(ease_type == EaseType::LINEAR){
            return "linear";
        }else if(ease_type == EaseType::HOLD){
            return "hold";
        }else{
            assert(false);
        }
    }

    static const EaseType stringToEaseType(std::string s) {
        if(s == "bezier"){
            return EaseType::BEZIER;
        }else if(s == "linear"){
            return EaseType::LINEAR;
        }else if(s == "hold"){
            return EaseType::HOLD;
        }else{
            assert(false);
        }
    }

    std::vector<Track> tracks;

protected:
    float lerp(float a, float b, float t) {
        return a + (b - a) * t;
    }

    float cubic_bezier(float p0, float p1, float p2, float p3, float t) {
        float u = 1.0 - t;
        return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3;
    }

    float bezier_interp(
        float t,
        float t0, float v0, const Ease& outEase,
        float t1, float v1, const Ease& inEase
    ) {
        float dt = t1 - t0;
        if (dt <= 0.0) return v0;
        float localT = (t - t0) / dt;

        float p0x = 0.0;
        float p3x = 1.0;
        float p1x = outEase.influence / 100.0;
        float p2x = 1.0 - inEase.influence / 100.0;

        float p0y = v0;
        float p3y = v1;

        // The speed in AE is "the amount of change in value per second"
        float p1y = v0 + (outEase.speed * dt / 3.0) * (outEase.influence / 100.0);
        float p2y = v1 - (inEase.speed * dt / 3.0) * (inEase.influence / 100.0);

        // Back-calculate the x corresponding to t(0-1) (approximate with Newton's method)
        float x = localT;
        float guess = x;
        for (int i = 0; i < 5; ++i) {
            float bez_x = cubic_bezier(p0x, p1x, p2x, p3x, guess);
            float bez_dx = 3 * (1 - guess) * (1 - guess) * (p1x - p0x)
                        + 6 * (1 - guess) * guess * (p2x - p1x)
                        + 3 * guess * guess * (p3x - p2x);
            if (bez_dx == 0.0) break;
            guess -= (bez_x - x) / bez_dx;
            if (guess < 0) guess = 0;
            if (guess > 1) guess = 1;
        }
        float t_bez = guess;

        return cubic_bezier(p0y, p1y, p2y, p3y, t_bez);
    }

    // vector<float> zeros(size_t n){
    //     std::vector<float> vs(n, 0.0f);
    //     return vs;
    // }

    vector<float> get_values_at_time(const std::vector<Keyframe>& keys, float t) {
        if (keys.empty()) return {};
        if (t <= keys.front().time) return keys.front().value;
        if (t >= keys.back().time) return keys.back().value;

        const size_t n = keys[0].value.size();

        vector<float> result(n, 0.0f);

        bool found = false;
        for (size_t i = 0; i < keys.size() - 1; ++i) {
            const auto& k0 = keys[i];
            const auto& k1 = keys[i + 1];

            if (t >= k0.time && t <= k1.time) {
                found = true;
                for (size_t j = 0; j < n; ++j) {
                    if (k0.interpolationOut == EaseType::HOLD) {
                        result[j] = k0.value[j];
                    } else if (k0.interpolationOut == EaseType::LINEAR) {
                        float localT = (t - k0.time) / (k1.time - k0.time);
                        result[j] = lerp(k0.value[j], k1.value[j], localT);
                    } else if (k0.interpolationOut == EaseType::BEZIER) {
                        result[j] = bezier_interp(
                            t,
                            k0.time, k0.value[j], k0.outEase,
                            k1.time, k1.value[j], k1.inEase
                        );
                    } else {
                        // fallback: linear
                        float localT = (t - k0.time) / (k1.time - k0.time);
                        result[j] = lerp(k0.value[j], k1.value[j], localT);
                    }
                }

                break;
            }
        }

        if(!found){
            for (size_t j = 0; j < n; ++j) {
                result[j] = keys.back().value[j];
            }
        }

        return result;
    }
};
