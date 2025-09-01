#include "ofApp.h"

size_t property_index1;
size_t property_index2;

//--------------------------------------------------------------
void ofApp::setup(){
    ae_easing.load("test3.json");
    
    ae_easing.dumpTracks();
    
    //  dumpTracks() shows:
    //    [notice ] ------------
    //    [notice ] property_name: Position
    //    [notice ] layer_name: A
    //    [notice ] parent_name: Transform
    //    [notice ] ( match_name: ADBE Position )
    //    [notice ] ------------
    //    [notice ] property_name: Rotation
    //    [notice ] layer_name: B
    //    [notice ] parent_name: Transform
    //    [notice ] ( match_name: ADBE Rotate Z )
    
    property_index1 = ae_easing.getPropertyIndex("Position", "A");
    property_index2 = ae_easing.getPropertyIndex("Rotation", "B");
    
//    ofSetRectMode(OF_RECTMODE_CENTER);
}

//--------------------------------------------------------------
void ofApp::update(){

}

//--------------------------------------------------------------
void ofApp::draw(){
    float t = std::fmodf(ofGetElapsedTimef(), 6.0f);
    ofVec2f p = ae_easing.get<ofVec2f>(t, property_index1);
    float deg = ae_easing.get<float>(t, property_index2);

    // NOTE:
    // - you can also write directly: `.get(t, property_name, layer_name, [parent_name])`

    ofDrawBitmapString("t: " + ofToString(t, 2), 50, 50);

    ofDrawRectangle(p.x - 400, p.y - 100, 50, 50);
    
    ofPushStyle();
    ofSetColor(255, 0, 0);
    ofTranslate(200, 50);
    ofRotateDeg(deg);
    ofDrawRectangle(0, 0, 200, 50);
    ofPopStyle();
}

//--------------------------------------------------------------
void ofApp::keyPressed(int key){

}

//--------------------------------------------------------------
void ofApp::keyReleased(int key){

}

//--------------------------------------------------------------
void ofApp::mouseMoved(int x, int y){

}

//--------------------------------------------------------------
void ofApp::mouseDragged(int x, int y, int button){

}

//--------------------------------------------------------------
void ofApp::mousePressed(int x, int y, int button){

}

//--------------------------------------------------------------
void ofApp::mouseReleased(int x, int y, int button){

}

//--------------------------------------------------------------
void ofApp::mouseEntered(int x, int y){

}

//--------------------------------------------------------------
void ofApp::mouseExited(int x, int y){

}

//--------------------------------------------------------------
void ofApp::windowResized(int w, int h){

}

//--------------------------------------------------------------
void ofApp::gotMessage(ofMessage msg){

}

//--------------------------------------------------------------
void ofApp::dragEvent(ofDragInfo dragInfo){ 

}
