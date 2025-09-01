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
    return get<vector<float>>(index, t).at(0);
}

template <>
ofVec2f ofxAEEasingLoader::get(std::string name, float t){
    auto v = get<vector<float>>(name, t);
    return ofVec2f(v.at(0), v.at(1));
}

template <>
ofVec2f ofxAEEasingLoader::get(int index, float t){
    auto v = get<vector<float>>(index, t);
    return ofVec2f(v.at(0), v.at(1));
}

template <>
ofVec3f ofxAEEasingLoader::get(std::string name, float t){
    auto v = get<vector<float>>(name, t);
    return ofVec3f(v.at(0), v.at(1), v.at(2));
}

template <>
ofVec3f ofxAEEasingLoader::get(int index, float t){
    auto v = get<vector<float>>(index, t);
    return ofVec3f(v.at(0), v.at(1), v.at(2));
}

template <>
ofVec4f ofxAEEasingLoader::get(std::string name, float t){
    auto v = get<vector<float>>(name, t);
    return ofVec4f(v.at(0), v.at(1), v.at(2), v.at(3));
}

template <>
ofVec4f ofxAEEasingLoader::get(int index, float t){
    auto v = get<vector<float>>(index, t);
    return ofVec4f(v.at(0), v.at(1), v.at(2), v.at(3));
}