#include "ofxAEEasingLoader.h"

template <>
vector<float> ofxAEEasingLoader::get(std::string name, float t){
    auto it = std::find_if(tracks.begin(), tracks.end(), [&name](const Track& t) {
        return t.name == name;
    });

    if (it != tracks.end()) {
        return get_values_at_time(it->keyframes, t);
    } else {
        ofLogError("ofxAEEasingLoader") << "name " << name << " not found";
        assert(false);
    }
}

template <>
vector<float> ofxAEEasingLoader::get(int index, float t){
    auto&& track = tracks.at(index);
    return get_values_at_time(track.keyframes, t);
}

template <>
float ofxAEEasingLoader::get(std::string name, float t){
    return get<vector<float>>(name, t).at(0);
}

template <>
float ofxAEEasingLoader::get(int index, float t){
    return get<vector<float>>(0, t).at(0);
}

template <>
float ofxAEEasingLoader::get(float t){
    return get<float>(0, t);
}