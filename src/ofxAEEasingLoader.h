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
        float value;
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
                keyframes.push_back({
                    k["time"].get<float>(),
                    k["value"].get<float>(),
                    stringToEaseType(k["interpolationOut"].get<std::string>()),
                    stringToEaseType(k["interpolationIn"].get<std::string>()),
                    outEase,
                    inEase
                });
            }

            ++i;
        }
    }

    float get(std::string name, float t){
        auto it = std::find_if(tracks.begin(), tracks.end(), [&name](const Track& t) {
            return t.name == name;
        });

        if (it != tracks.end()) {
            return get_value_at_time(it->keyframes, t);
        } else {
            ofLogError("ofxAEEasingLoader") << "name " << name << " not found";
            assert(false);
        }
    }

    float get(int index, float t){
        auto&& track = tracks.at(index);
        return get_value_at_time(track.keyframes, t);
    }

    float get(float t){
        return get(0, t);
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

    // reference: https://qiita.com/edo_m18/items/5e7e2b5e0e6e6e6e6e6e
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

    float get_value_at_time(const std::vector<Keyframe>& keys, float t) {
        if (keys.empty()) return 0.0;
        if (t <= keys.front().time) return keys.front().value;
        if (t >= keys.back().time) return keys.back().value;

        for (size_t i = 0; i < keys.size() - 1; ++i) {
            const auto& k0 = keys[i];
            const auto& k1 = keys[i + 1];
            if (t >= k0.time && t <= k1.time) {
                if (k0.interpolationOut == EaseType::HOLD) {
                    return k0.value;
                } else if (k0.interpolationOut == EaseType::LINEAR) {
                    float localT = (t - k0.time) / (k1.time - k0.time);
                    return lerp(k0.value, k1.value, localT);
                } else if (k0.interpolationOut == EaseType::BEZIER) {
                    return bezier_interp(
                        t,
                        k0.time, k0.value, k0.outEase,
                        k1.time, k1.value, k1.inEase
                    );
                } else {
                    // fallback: linear
                    float localT = (t - k0.time) / (k1.time - k0.time);
                    return lerp(k0.value, k1.value, localT);
                }
            }
        }
        return keys.back().value;
    }
};
