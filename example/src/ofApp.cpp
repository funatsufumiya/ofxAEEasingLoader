#include "ofApp.h"

//--------------------------------------------------------------
void ofApp::setup(){
    ae_easing.load("test.json");
}

//--------------------------------------------------------------
void ofApp::update(){

}

//--------------------------------------------------------------
void ofApp::draw(){
    float t = std::fmodf(ofGetElapsedTimef(), 14.0f);
    float y = ae_easing.get<float>(t);

    // NOTE:
    // - you can also specify property name: `ae_easing.get(t, "prop name")`
    //    - property name also matches match_name.
    // - alternatively, specify property index: `ae_easing.get(t, 0)` ( `.get(t)` is short for `.get(t, 0)` )

    ofDrawBitmapString("t: " + ofToString(t, 2), 50, 50);

    ofDrawRectangle(100, y - 600, 50, 50);
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