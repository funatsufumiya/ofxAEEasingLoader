(function() {
    var FOLDER = Folder.selectDialog('Select a folder to export');
    if(!FOLDER) {
        $.writeln("Canceled");
        return;
    }

    // Map interpolation type number to string
    function interpolationTypeToString(type) {
        // These are standard AE constants
        // KeyframeInterpolationType.LINEAR = 6610
        // KeyframeInterpolationType.BEZIER = 6613
        // KeyframeInterpolationType.HOLD = 6612
        switch(type) {
            case KeyframeInterpolationType.LINEAR:
            case 6610:
                return "linear";
            case KeyframeInterpolationType.BEZIER:
            case 6613:
                return "bezier";
            case KeyframeInterpolationType.HOLD:
            case 6612:
                return "hold";
            default:
                return "unknown";
        }
    }

    function getEaseInfo(easeArr) {
        var ret = [];
        for(var i=0; i<easeArr.length; i++) {
            ret.push({
                influence: easeArr[i].influence,
                speed: easeArr[i].speed
            });
        }
        return ret;
    }

    var sel = app.project.activeItem.selectedProperties;
    if(sel.length === 0) {
        alert("Please select at least one property with keyframes.");
        return;
    }

    var result = [];
    for(var i=0; i<sel.length; i++) {
        var prop = sel[i];
        if(!prop.isTimeVarying) continue;
        var keys = [];
        for(var k=1; k<=prop.numKeys; k++) {
            keys.push({
                time: prop.keyTime(k),
                value: prop.keyValue(k),
                inEase: getEaseInfo(prop.keyInTemporalEase(k)),
                outEase: getEaseInfo(prop.keyOutTemporalEase(k)),
                interpolationIn: interpolationTypeToString(prop.keyInInterpolationType(k)),
                interpolationOut: interpolationTypeToString(prop.keyOutInterpolationType(k))
            });
        }
        result.push({
            propertyName: prop.name,
            matchName: prop.matchName,
            keys: keys
        });
    }

    var file = new File(FOLDER.fsName + "/selectedKeys.json");
    if(file.open("w")) {
        file.encoding = "UTF-8";
        file.write(JSON.stringify(result, null, 2));
        file.close();
        alert("Export completed: " + file.fsName);
    } else {
        alert("Failed to write file.");
    }
})();