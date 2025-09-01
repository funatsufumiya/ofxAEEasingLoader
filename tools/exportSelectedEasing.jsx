 #include "json2.js";

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

    function findLayerNameForProp(prop, comp) {
        var layers = comp.layers;
        for (var i = 1; i <= layers.length; i++) {
            var layer = layers[i];
            if (searchPropInTree(layer, prop)) {
                return layer.name;
            }
        }
        return null;
    }

    function searchPropInTree(rootProp, targetProp) {
        if (rootProp === targetProp) return true;
        if (rootProp.numProperties && rootProp.numProperties > 0) {
            for (var i = 1; i <= rootProp.numProperties; i++) {
                if (searchPropInTree(rootProp.property(i), targetProp)) {
                    return true;
                }
            }
        }
        return false;
    }

    var comp = app.project.activeItem;
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
        var layerName = findLayerNameForProp(prop, comp);
        result.push({
            propertyName: prop.name,
            layerName: layerName,
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