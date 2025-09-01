#include "ofApp.h"

//--------------------------------------------------------------
void ofApp::setup(){
    ae_easing.load("test2.json");
}

//--------------------------------------------------------------
void ofApp::update(){

}

//--------------------------------------------------------------
void ofApp::draw(){
    float t = std::fmodf(ofGetElapsedTimef(), 6.0f);
    ofVec2f p = ae_easing.get<ofVec2f>(t);

    // NOTE:
    // - you can also specify property name: `ae_easing.get("prop name", t)`
    // - alternatively, specify index: `ae_easing.get(0, t)` ( `.get(t)` is short for `.get(0, t)` )

    ofDrawBitmapString("t: " + ofToString(t, 2), 50, 50);

    ofDrawRectangle(p.x - 400, p.y - 100, 50, 50);
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