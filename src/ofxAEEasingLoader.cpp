#include "ofxAEEasingLoader.h"

size_t ofxAEEasingLoader::getPropertyIndex(std::string property_name, std::string layer_name, std::string parent_name){
    auto it = std::find_if(tracks.begin(), tracks.end(), [&property_name, &parent_name, &layer_name](const Track& t) {
        if(parent_name != "" && layer_name != ""){
            return (t.propertyName == property_name || t.matchName == property_name)
                && t.parentName == parent_name
                && t.layerName == layer_name;
        }else if(parent_name != ""){
            return (t.propertyName == property_name || t.matchName == property_name)
                && t.parentName == parent_name;
        }else if(layer_name != ""){
            return (t.propertyName == property_name || t.matchName == property_name)
                && t.layerName == layer_name;
        }else{
            return (t.propertyName == property_name || t.matchName == property_name);
        }
    });

    if (it != tracks.end()) {
        std::size_t index = std::distance(std::begin(tracks), it);
        return index;
    }else{
        ofLogError("ofxAEEasingLoader") << "property index not found";
        assert(false);
    }
}

template <>
vector<float> ofxAEEasingLoader::get(float t, std::string property_name, std::string layer_name, std::string parent_name){
    auto it = std::find_if(tracks.begin(), tracks.end(), [&property_name, &parent_name, &layer_name](const Track& t) {
        if(parent_name != "" && layer_name != ""){
            return (t.propertyName == property_name || t.matchName == property_name)
                && t.parentName == parent_name
                && t.layerName == layer_name;
        }else if(parent_name != ""){
            return (t.propertyName == property_name || t.matchName == property_name)
                && t.parentName == parent_name;
        }else if(layer_name != ""){
            return (t.propertyName == property_name || t.matchName == property_name)
                && t.layerName == layer_name;
        }else{
            return (t.propertyName == property_name || t.matchName == property_name);
        }
    });

    if (it != tracks.end()) {
        return get_values_at_time(it->keyframes, t);
    } else {
        ofLogError("ofxAEEasingLoader") << "property not found";
        assert(false);
    }
}

template <>
vector<float> ofxAEEasingLoader::get(float t, size_t index){
    auto&& track = tracks.at(index);
    return get_values_at_time(track.keyframes, t);
}

template <>
float ofxAEEasingLoader::get(float t, std::string property_name, std::string layer_name, std::string parent_name){
    return get<vector<float>>(t, property_name, layer_name, parent_name).at(0);
}

template <>
float ofxAEEasingLoader::get(float t, size_t index){
    return get<vector<float>>(t, index).at(0);
}

template <>
ofVec2f ofxAEEasingLoader::get(float t, std::string property_name, std::string layer_name, std::string parent_name){
    auto v = get<vector<float>>(t, property_name, layer_name, parent_name);
    return ofVec2f(v.at(0), v.at(1));
}

template <>
ofVec2f ofxAEEasingLoader::get(float t, size_t index){
    auto v = get<vector<float>>(t, index);
    return ofVec2f(v.at(0), v.at(1));
}

template <>
ofVec3f ofxAEEasingLoader::get(float t, std::string property_name, std::string layer_name, std::string parent_name){
    auto v = get<vector<float>>(t, property_name, layer_name, parent_name);
    return ofVec3f(v.at(0), v.at(1), v.at(2));
}

template <>
ofVec3f ofxAEEasingLoader::get(float t, size_t index){
    auto v = get<vector<float>>(t, index);
    return ofVec3f(v.at(0), v.at(1), v.at(2));
}

template <>
ofVec4f ofxAEEasingLoader::get(float t, std::string property_name, std::string layer_name, std::string parent_name){
    auto v = get<vector<float>>(t, property_name, layer_name, parent_name);
    return ofVec4f(v.at(0), v.at(1), v.at(2), v.at(3));
}

template <>
ofVec4f ofxAEEasingLoader::get(float t, size_t index){
    auto v = get<vector<float>>(t, index);
    return ofVec4f(v.at(0), v.at(1), v.at(2), v.at(3));
}
