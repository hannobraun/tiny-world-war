(function() {

  window.define = function(moduleName, dependencyNames, moduleFactory) {
    if (window.modules == null) window.modules = {};
    if (window.modules[moduleName] == null) {
      return window.modules[moduleName] = {
        name: moduleName,
        dependencyNames: dependencyNames,
        factory: moduleFactory
      };
    } else {
      throw "Module " + moduleName + " is already defined.";
    }
  };

  window.load = function(moduleName, loadedModules) {
    var dependencies, dependencyName, module;
    if (window.modules == null) throw "No modules have been defined.";
    if (window.modules[moduleName] == null) {
      throw "A module called " + moduleName + " does not exist.";
    }
    if (loadedModules == null) loadedModules = {};
    if (loadedModules[moduleName] == null) {
      module = window.modules[moduleName];
      dependencies = (function() {
        var _i, _len, _ref, _results;
        _ref = module.dependencyNames;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          dependencyName = _ref[_i];
          if (modules[dependencyName] == null) {
            throw ("A module called \"" + dependencyName + "\" (defined as a ") + ("dependency in \"" + moduleName + "\") does not exist.");
          }
          _results.push(load(dependencyName, loadedModules));
        }
        return _results;
      })();
      loadedModules[moduleName] = module.factory.apply(void 0, dependencies);
    }
    return loadedModules[moduleName];
  };

  define("Loader", ["Images", "Game"], function(Images, Game) {
    return Images.loadImages(Game.imagePaths, function(rawImages) {
      var images;
      images = Images.process(rawImages);
      return Game.initGame(images);
    });
  });

  define("Transform2d", [], function() {
    var module;
    return module = {
      identityMatrix: function() {
        return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      },
      translationMatrix: function(v) {
        return [[1, 0, v[0]], [0, 1, v[1]], [0, 0, 1]];
      },
      rotationMatrix: function(angle) {
        return [[Math.cos(angle), -Math.sin(angle), 0], [Math.sin(angle), Math.cos(angle), 0], [0, 0, 1]];
      },
      scalingMatrix: function(factor) {
        return [[factor, 0, 0], [0, factor, 0], [0, 0, 1]];
      }
    };
  });

  define("Entities", [], function() {
    var module;
    return module = {
      createEntity: function(factories, components, type, args) {
        var component, componentName, entity, _ref, _results;
        entity = factories[type](args);
        _ref = entity.components;
        _results = [];
        for (componentName in _ref) {
          component = _ref[componentName];
          _results.push(components[componentName][entity.id] = component);
        }
        return _results;
      },
      destroyEntity: function(components, entityId) {
        var componentMap, componentType, _results;
        _results = [];
        for (componentType in components) {
          componentMap = components[componentType];
          _results.push(delete componentMap[entityId]);
        }
        return _results;
      }
    };
  });

  define("Images", [], function() {
    var module;
    return module = {
      loadImages: function(imagePaths, onLoad) {
        var image, imagePath, images, numberOfImagesToLoad, _i, _len, _results;
        images = {};
        numberOfImagesToLoad = imagePaths.length;
        _results = [];
        for (_i = 0, _len = imagePaths.length; _i < _len; _i++) {
          imagePath = imagePaths[_i];
          image = new Image;
          images[imagePath] = image;
          image.onload = function() {
            numberOfImagesToLoad -= 1;
            if (numberOfImagesToLoad === 0) return onLoad(images);
          };
          _results.push(image.src = imagePath);
        }
        return _results;
      },
      process: function(rawImages) {
        var imageId, images, rawImage;
        images = {};
        for (imageId in rawImages) {
          rawImage = rawImages[imageId];
          images[imageId] = {
            rawImage: rawImage,
            positionOffset: [-rawImage.width / 2, -rawImage.height / 2],
            orientationOffset: 0
          };
        }
        return images;
      }
    };
  });

  define("Rendering", [], function() {
    var drawFunctions, module;
    drawFunctions = {
      "image": function(images, context, renderable) {
        var image;
        image = images[renderable.resourceId];
        if (image == null) {
          throw "Image " + renderable.resourceId + " does not exist.";
        }
        context.translate(renderable.position[0], renderable.position[1]);
        context.rotate(renderable.orientation + image.orientationOffset);
        context.translate(image.positionOffset[0], image.positionOffset[1]);
        return context.drawImage(image.rawImage, 0, 0);
      },
      "circle": function(shapes, context, renderable) {
        var shape;
        shape = shapes[renderable.resourceId];
        context.translate(renderable.position[0], renderable.position[1]);
        context.rotate(renderable.orientation);
        context.translate(shape.offset[0], shape.offset[1]);
        context.beginPath();
        context.arc(0, 0, shape.circle.radius, 0, Math.PI * 2, true);
        return context.stroke();
      }
    };
    return module = {
      createDisplay: function() {
        var canvas, context, display;
        canvas = document.getElementById("canvas");
        context = canvas.getContext("2d");
        context.translate(canvas.width / 2, canvas.height / 2);
        return display = {
          context: context,
          size: [canvas.width, canvas.height]
        };
      },
      createRenderable: function(type, resourceId) {
        var renderable;
        return renderable = {
          type: type,
          resourceId: resourceId,
          position: [0, 0],
          orientation: 0
        };
      },
      createCamera: function() {
        var camera;
        return camera = {
          position: [0, 0]
        };
      },
      render: function(display, renderData, renderables) {
        var context, drawRenderable, height, renderable, type, width, _i, _len, _results;
        context = display.context;
        width = display.size[0];
        height = display.size[1];
        context.clearRect(-width / 2, -height / 2, width, height);
        _results = [];
        for (_i = 0, _len = renderables.length; _i < _len; _i++) {
          renderable = renderables[_i];
          context.save();
          type = renderable.type;
          drawRenderable = drawFunctions[type];
          drawRenderable(renderData[type], context, renderable);
          _results.push(context.restore());
        }
        return _results;
      }
    };
  });

  define("Input", [], function() {
    var ensureKeyNameIsValid, keyCode, keyCodesByName, keyName, keyNamesByCode, module;
    keyNamesByCode = {
      8: "backspace",
      9: "tab",
      13: "enter",
      16: "shift",
      17: "ctrl",
      18: "alt",
      19: "pause",
      20: "caps lock",
      27: "escape",
      32: "space",
      33: "page up",
      34: "page down",
      35: "end",
      36: "home",
      37: "left arrow",
      38: "up arrow",
      39: "right arrow",
      40: "down arrow",
      45: "insert",
      46: "delete",
      48: "0",
      49: "1",
      50: "2",
      51: "3",
      52: "4",
      53: "5",
      54: "6",
      55: "7",
      56: "8",
      57: "9",
      65: "a",
      66: "b",
      67: "c",
      68: "d",
      69: "e",
      70: "f",
      71: "g",
      72: "h",
      73: "i",
      74: "j",
      75: "k",
      76: "l",
      77: "m",
      78: "n",
      79: "o",
      80: "p",
      81: "q",
      82: "r",
      83: "s",
      84: "t",
      85: "u",
      86: "v",
      87: "w",
      88: "x",
      89: "y",
      90: "z",
      91: "left window key",
      92: "right window key",
      93: "select key",
      96: "numpad 0",
      97: "numpad 1",
      98: "numpad 2",
      99: "numpad 3",
      100: "numpad 4",
      101: "numpad 5",
      102: "numpad 6",
      103: "numpad 7",
      104: "numpad 8",
      105: "numpad 9",
      106: "multiply",
      107: "add",
      109: "subtract",
      110: "decimal point",
      111: "divide",
      112: "f1",
      113: "f2",
      114: "f3",
      115: "f4",
      116: "f5",
      117: "f6",
      118: "f7",
      119: "f8",
      120: "f9",
      121: "f10",
      122: "f11",
      123: "f12",
      144: "num lock",
      145: "scroll lock",
      186: "semi-colon",
      187: "equal sign",
      188: "comma",
      189: "dash",
      190: "period",
      191: "forward slash",
      192: "grave accent",
      219: "open bracket",
      220: "back slash",
      221: "close braket",
      222: "single quote"
    };
    keyCodesByName = {};
    for (keyCode in keyNamesByCode) {
      keyName = keyNamesByCode[keyCode];
      keyCodesByName[keyName] = parseInt(keyCode);
    }
    ensureKeyNameIsValid = function(keyName) {
      if (keyCodesByName[keyName] == null) {
        throw "\"" + keyName + "\" is not a valid key name.";
      }
    };
    return module = {
      keyNamesByCode: keyNamesByCode,
      keyCodesByName: keyCodesByName,
      createCurrentInput: function() {
        var currentInput;
        currentInput = {};
        window.addEventListener("keydown", function(keyDownEvent) {
          return currentInput[keyNamesByCode[keyDownEvent.keyCode]] = true;
        });
        window.addEventListener("keyup", function(keyUpEvent) {
          return currentInput[keyNamesByCode[keyUpEvent.keyCode]] = false;
        });
        return currentInput;
      },
      isKeyDown: function(currentInput, keyName) {
        ensureKeyNameIsValid(keyName);
        return currentInput[keyName] === true;
      }
    };
  });

  define("Vec2", [], function() {
    var module;
    return module = {
      copy: function(v) {
        return [v[0], v[1]];
      },
      scale: function(v, s) {
        v[0] *= s;
        return v[1] *= s;
      },
      add: function(v1, v2) {
        v1[0] += v2[0];
        return v1[1] += v2[1];
      },
      subtract: function(v1, v2) {
        v1[0] -= v2[0];
        return v1[1] -= v2[1];
      },
      dot: function(v1, v2) {
        return v1[0] * v2[0] + v1[1] * v2[1];
      },
      length: function(v) {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
      },
      squaredLength: function(v) {
        return v[0] * v[0] + v[1] * v[1];
      },
      unit: function(v) {
        var length;
        length = module.length(v);
        v[0] /= length;
        return v[1] /= length;
      },
      applyTransform: function(v, t) {
        var x, y;
        x = v[0], y = v[1];
        v[0] = x * t[0][0] + y * t[0][1] + 1 * t[0][2];
        return v[1] = x * t[1][0] + y * t[1][1] + 1 * t[1][2];
      }
    };
  });

  define("Physics", ["Vec2"], function(Vec2) {
    var module;
    return module = {
      parameters: {
        collisionResponse: {
          k: 10000,
          b: 0
        }
      },
      createBody: function() {
        var body;
        return body = {
          position: [0, 0],
          velocity: [0, 0],
          acceleration: [0, 0],
          orientation: 0,
          angularVelocity: 0,
          forces: [],
          mass: 1
        };
      },
      integrate: function(bodies, passedTimeInS) {
        var body, entityId, force, movementFromAcceleration, movementFromVelocity, newAcceleration, velocityChange, _i, _len, _ref, _results;
        _results = [];
        for (entityId in bodies) {
          body = bodies[entityId];
          newAcceleration = [0, 0];
          _ref = body.forces;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            force = _ref[_i];
            Vec2.scale(force, 1 / body.mass);
            Vec2.add(newAcceleration, force);
          }
          body.forces.length = 0;
          movementFromVelocity = Vec2.copy(body.velocity);
          Vec2.scale(movementFromVelocity, passedTimeInS);
          movementFromAcceleration = Vec2.copy(body.acceleration);
          Vec2.scale(movementFromAcceleration, 0.5);
          Vec2.scale(movementFromAcceleration, passedTimeInS * passedTimeInS);
          Vec2.add(body.position, movementFromVelocity);
          Vec2.add(body.position, movementFromAcceleration);
          velocityChange = Vec2.copy(body.acceleration);
          Vec2.add(velocityChange, newAcceleration);
          Vec2.scale(velocityChange, 0.5);
          Vec2.scale(velocityChange, passedTimeInS);
          Vec2.add(body.velocity, velocityChange);
          _results.push(body.acceleration = newAcceleration);
        }
        return _results;
      },
      integrateOrientation: function(bodies, passedTimeInS) {
        var body, entityId, _results;
        _results = [];
        for (entityId in bodies) {
          body = bodies[entityId];
          _results.push(body.orientation += body.angularVelocity * passedTimeInS);
        }
        return _results;
      },
      applyForces: function(bodies) {
        var body, entityId, force, _i, _len, _ref, _results;
        _results = [];
        for (entityId in bodies) {
          body = bodies[entityId];
          body.acceleration = [0, 0];
          _ref = body.forces;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            force = _ref[_i];
            Vec2.scale(force, 1 / body.mass);
            Vec2.add(body.acceleration, force);
          }
          _results.push(body.forces.length = 0);
        }
        return _results;
      },
      update: function(bodies, passedTimeInS) {
        module.integrate(bodies, passedTimeInS);
        module.integrateOrientation(bodies, passedTimeInS);
        return module.applyForces(bodies);
      },
      handleContacts: function(contacts, bodies, parameters) {
        var b, bodyA, bodyB, contact, damping, force, k, negativeForce, relativeVelocity, spring, _i, _len, _results;
        k = parameters.k;
        b = parameters.b;
        _results = [];
        for (_i = 0, _len = contacts.length; _i < _len; _i++) {
          contact = contacts[_i];
          bodyA = bodies[contact.bodies[0]];
          bodyB = bodies[contact.bodies[1]];
          relativeVelocity = Vec2.copy(bodyA.velocity);
          Vec2.subtract(relativeVelocity, bodyB.velocity);
          spring = Vec2.copy(contact.normal);
          Vec2.scale(spring, -k * contact.depth);
          damping = Vec2.copy(contact.normal);
          Vec2.scale(damping, b * Vec2.dot(contact.normal, relativeVelocity));
          force = Vec2.copy(spring);
          Vec2.add(force, damping);
          Vec2.scale(force, 0.5);
          negativeForce = Vec2.copy(force);
          Vec2.scale(negativeForce, -1);
          bodyA.forces.push(force);
          _results.push(bodyB.forces.push(negativeForce));
        }
        return _results;
      }
    };
  });

  define("Camera", ["Mat3x3", "Vec2", "Transform2d"], function(Mat3x3, Vec2, Transform2d) {
    var module;
    return module = {
      createCamera: function() {
        var camera;
        return camera = {
          position: [0, 0],
          rotation: 0,
          zoomFactor: 1
        };
      },
      transformRenderables: function(camera, renderables) {
        var offset, r, renderable, s, t, transform, _i, _len, _results;
        offset = Vec2.copy(camera.position);
        Vec2.scale(offset, -1);
        transform = Transform2d.identityMatrix();
        t = Transform2d.translationMatrix(offset);
        r = Transform2d.rotationMatrix(camera.rotation);
        s = Transform2d.scalingMatrix(camera.zoomFactor);
        Mat3x3.multiply(transform, s);
        Mat3x3.multiply(transform, r);
        Mat3x3.multiply(transform, t);
        _results = [];
        for (_i = 0, _len = renderables.length; _i < _len; _i++) {
          renderable = renderables[_i];
          _results.push(Vec2.applyTransform(renderable.position, transform));
        }
        return _results;
      }
    };
  });

  define("Collisions", ["Vec2"], function(Vec2) {
    var module;
    return module = {
      createCircle: function(radius) {
        var shape;
        return shape = {
          type: "circle",
          radius: radius
        };
      },
      buildPairs: function(shapes) {
        var entityIdA, entityIdB, entityUsed, pairs, shapeA, shapeB;
        entityUsed = {};
        pairs = [];
        for (entityIdA in shapes) {
          shapeA = shapes[entityIdA];
          entityUsed[entityIdA] = true;
          for (entityIdB in shapes) {
            shapeB = shapes[entityIdB];
            if (!entityUsed[entityIdB]) pairs.push([entityIdA, entityIdB]);
          }
        }
        return pairs;
      },
      checkCollision: function(positionA, positionB, shapeA, shapeB) {
        var collision, d, distance, normal, penetrationDepth, point, sumOfRadii;
        sumOfRadii = shapeA.radius + shapeB.radius;
        d = Vec2.copy(positionB);
        Vec2.subtract(d, positionA);
        distance = Vec2.length(d);
        collision = sumOfRadii >= distance;
        if (collision) {
          normal = Vec2.copy(d);
          Vec2.unit(normal);
          penetrationDepth = sumOfRadii - distance;
          point = Vec2.copy(normal);
          Vec2.scale(point, shapeA.radius - penetrationDepth / 2);
          Vec2.add(point, positionA);
          return {
            touches: collision,
            normal: normal,
            depth: penetrationDepth,
            point: point
          };
        } else {
          return {
            touches: collision
          };
        }
      }
    };
  });

  define("Mat3x3", [], function() {
    var module;
    return module = {
      multiply: function(m1, m2) {
        var m00, m01, m02, m10, m11, m12, m20, m21, m22;
        m00 = m1[0][0];
        m01 = m1[0][1];
        m02 = m1[0][2];
        m10 = m1[1][0];
        m11 = m1[1][1];
        m12 = m1[1][2];
        m20 = m1[2][0];
        m21 = m1[2][1];
        m22 = m1[2][2];
        m1[0][0] = m00 * m2[0][0] + m01 * m2[1][0] + m02 * m2[2][0];
        m1[0][1] = m00 * m2[0][1] + m01 * m2[1][1] + m02 * m2[2][1];
        m1[0][2] = m00 * m2[0][2] + m01 * m2[1][2] + m02 * m2[2][2];
        m1[1][0] = m10 * m2[0][0] + m11 * m2[1][0] + m12 * m2[2][0];
        m1[1][1] = m10 * m2[0][1] + m11 * m2[1][1] + m12 * m2[2][1];
        m1[1][2] = m10 * m2[0][2] + m11 * m2[1][2] + m12 * m2[2][2];
        m1[2][0] = m20 * m2[0][0] + m21 * m2[1][0] + m22 * m2[2][0];
        m1[2][1] = m20 * m2[0][1] + m21 * m2[1][1] + m22 * m2[2][1];
        return m1[2][2] = m20 * m2[0][2] + m21 * m2[1][2] + m22 * m2[2][2];
      }
    };
  });

  define("ModifiedPhysics", ["Vec2"], function(Vec2) {
    var module;
    return module = {
      parameters: {
        collisionResponse: {
          k: 10000,
          b: 0
        }
      },
      createBody: function() {
        var body;
        return body = {
          position: [0, 0],
          velocity: [0, 0],
          acceleration: [0, 0],
          orientation: 0,
          angularVelocity: 0,
          forces: [],
          mass: 1
        };
      },
      integrate: function(bodies, passedTimeInS) {
        var body, entityId, force, newAcceleration, positionChange, velocityChange, _i, _len, _ref, _results;
        _results = [];
        for (entityId in bodies) {
          body = bodies[entityId];
          newAcceleration = [0, 0];
          _ref = body.forces;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            force = _ref[_i];
            Vec2.scale(force, 1 / body.mass);
            Vec2.add(newAcceleration, force);
          }
          body.forces.length = 0;
          body.acceleration = newAcceleration;
          velocityChange = Vec2.copy(body.acceleration);
          Vec2.scale(velocityChange, passedTimeInS);
          Vec2.add(body.velocity, velocityChange);
          positionChange = Vec2.copy(body.velocity);
          Vec2.scale(positionChange, passedTimeInS);
          _results.push(Vec2.add(body.position, positionChange));
        }
        return _results;
      },
      integrateOrientation: function(bodies, passedTimeInS) {
        var body, entityId, _results;
        _results = [];
        for (entityId in bodies) {
          body = bodies[entityId];
          _results.push(body.orientation += body.angularVelocity * passedTimeInS);
        }
        return _results;
      },
      applyForces: function(bodies) {
        var body, entityId, force, _i, _len, _ref, _results;
        _results = [];
        for (entityId in bodies) {
          body = bodies[entityId];
          body.acceleration = [0, 0];
          _ref = body.forces;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            force = _ref[_i];
            Vec2.scale(force, 1 / body.mass);
            Vec2.add(body.acceleration, force);
          }
          _results.push(body.forces.length = 0);
        }
        return _results;
      },
      update: function(bodies, passedTimeInS) {
        module.integrate(bodies, passedTimeInS);
        module.integrateOrientation(bodies, passedTimeInS);
        return module.applyForces(bodies);
      },
      handleContacts: function(contacts, bodies, parameters) {
        var b, bodyA, bodyB, contact, damping, force, k, negativeForce, relativeVelocity, spring, _i, _len, _results;
        k = parameters.k;
        b = parameters.b;
        _results = [];
        for (_i = 0, _len = contacts.length; _i < _len; _i++) {
          contact = contacts[_i];
          bodyA = bodies[contact.bodies[0]];
          bodyB = bodies[contact.bodies[1]];
          relativeVelocity = Vec2.copy(bodyA.velocity);
          Vec2.subtract(relativeVelocity, bodyB.velocity);
          spring = Vec2.copy(contact.normal);
          Vec2.scale(spring, -k * contact.depth);
          damping = Vec2.copy(contact.normal);
          Vec2.scale(damping, b * Vec2.dot(contact.normal, relativeVelocity));
          force = Vec2.copy(spring);
          Vec2.add(force, damping);
          Vec2.scale(force, 0.5);
          negativeForce = Vec2.copy(force);
          Vec2.scale(negativeForce, -1);
          bodyA.forces.push(force);
          _results.push(bodyB.forces.push(negativeForce));
        }
        return _results;
      }
    };
  });

  define("ModifiedRendering", [], function() {
    var drawFunctions, module;
    drawFunctions = {
      "image": function(images, context, renderable) {
        var image;
        image = images[renderable.resourceId];
        if (image == null) {
          throw "Image " + renderable.resourceId + " does not exist.";
        }
        context.translate(renderable.position[0], renderable.position[1]);
        context.rotate(renderable.orientation + image.orientationOffset);
        context.translate(image.positionOffset[0], image.positionOffset[1]);
        return context.drawImage(image.rawImage, 0, 0);
      },
      "circle": function(shapes, context, renderable) {
        var shape;
        shape = shapes[renderable.resourceId];
        context.strokeStyle = renderable.color || "rgb(255,255,255)";
        context.translate(renderable.position[0], renderable.position[1]);
        context.rotate(renderable.orientation);
        context.translate(shape.offset[0], shape.offset[1]);
        context.beginPath();
        context.arc(0, 0, shape.circle.radius, 0, Math.PI * 2, true);
        return context.stroke();
      },
      "ellipse": function(_, context, renderable) {
        var ellipse;
        ellipse = renderable.ellipse;
        context.strokeStyle = ellipse.color;
        context.translate(renderable.position[0], renderable.position[1]);
        context.rotate(renderable.orientation);
        context.scale(ellipse.semiMajorAxis / ellipse.semiMinorAxis, 1);
        context.beginPath();
        context.arc(0, 0, ellipse.semiMinorAxis, 0, 2 * Math.PI, false);
        context.stroke();
        return context.closePath();
      },
      "rectangle": function(_, context, renderable) {
        context.fillStyle = renderable.color || "rgb(255,255,255)";
        return context.fillRect(renderable.position[0], renderable.position[1], renderable.size[0], renderable.size[1]);
      },
      "hollowRectangle": function(_, context, renderable) {
        context.strokeStyle = renderable.color || "rgb(0,0,0)";
        return context.strokeRect(renderable.position[0], renderable.position[1], renderable.size[0], renderable.size[1]);
      },
      "line": function(_, context, renderable) {
        context.strokeStyle = renderable.color || "rgb(255,255,255)";
        context.beginPath();
        context.moveTo(renderable.start[0], renderable.start[1]);
        context.lineTo(renderable.end[0], renderable.end[1]);
        context.closePath();
        return context.stroke();
      },
      "text": function(_, context, renderable) {
        context.fillStyle = renderable.color || "rgb(0,0,0)";
        if (renderable.font != null) context.font = renderable.font;
        if (renderable.bold != null) context.font = "bold " + context.font;
        return context.fillText(renderable.text, renderable.position[0], renderable.position[1]);
      }
    };
    return module = {
      createDisplay: function() {
        var canvas, context, display;
        canvas = document.getElementById("canvas");
        context = canvas.getContext("2d");
        context.translate(canvas.width / 2, canvas.height / 2);
        return display = {
          context: context,
          size: [canvas.width, canvas.height]
        };
      },
      createRenderable: function(type, resourceId) {
        var renderable;
        return renderable = {
          type: type,
          resourceId: resourceId,
          position: [0, 0],
          orientation: 0
        };
      },
      createCamera: function() {
        var camera;
        return camera = {
          position: [0, 0]
        };
      },
      render: function(display, renderData, renderables) {
        var context, drawRenderable, height, renderable, type, width, _i, _len, _results;
        context = display.context;
        width = display.size[0];
        height = display.size[1];
        context.clearRect(-width / 2, -height / 2, width, height);
        _results = [];
        for (_i = 0, _len = renderables.length; _i < _len; _i++) {
          renderable = renderables[_i];
          context.save();
          type = renderable.type;
          drawRenderable = drawFunctions[type];
          drawRenderable(renderData[type], context, renderable);
          _results.push(context.restore());
        }
        return _results;
      }
    };
  });

  define("ModifiedInput", [], function() {
    var ensureKeyNameIsValid, keyCode, keyCodesByName, keyName, keyNamesByCode, module;
    keyNamesByCode = {
      8: "backspace",
      9: "tab",
      13: "enter",
      16: "shift",
      17: "ctrl",
      18: "alt",
      19: "pause",
      20: "caps lock",
      27: "escape",
      32: "space",
      33: "page up",
      34: "page down",
      35: "end",
      36: "home",
      37: "left arrow",
      38: "up arrow",
      39: "right arrow",
      40: "down arrow",
      45: "insert",
      46: "delete",
      48: "0",
      49: "1",
      50: "2",
      51: "3",
      52: "4",
      53: "5",
      54: "6",
      55: "7",
      56: "8",
      57: "9",
      65: "a",
      66: "b",
      67: "c",
      68: "d",
      69: "e",
      70: "f",
      71: "g",
      72: "h",
      73: "i",
      74: "j",
      75: "k",
      76: "l",
      77: "m",
      78: "n",
      79: "o",
      80: "p",
      81: "q",
      82: "r",
      83: "s",
      84: "t",
      85: "u",
      86: "v",
      87: "w",
      88: "x",
      89: "y",
      90: "z",
      91: "left window key",
      92: "right window key",
      93: "select key",
      96: "numpad 0",
      97: "numpad 1",
      98: "numpad 2",
      99: "numpad 3",
      100: "numpad 4",
      101: "numpad 5",
      102: "numpad 6",
      103: "numpad 7",
      104: "numpad 8",
      105: "numpad 9",
      106: "multiply",
      107: "add",
      109: "subtract",
      110: "decimal point",
      111: "divide",
      112: "f1",
      113: "f2",
      114: "f3",
      115: "f4",
      116: "f5",
      117: "f6",
      118: "f7",
      119: "f8",
      120: "f9",
      121: "f10",
      122: "f11",
      123: "f12",
      144: "num lock",
      145: "scroll lock",
      186: "semi-colon",
      187: "equal sign",
      188: "comma",
      189: "dash",
      190: "period",
      191: "forward slash",
      192: "grave accent",
      219: "open bracket",
      220: "back slash",
      221: "close braket",
      222: "single quote"
    };
    keyCodesByName = {};
    for (keyCode in keyNamesByCode) {
      keyName = keyNamesByCode[keyCode];
      keyCodesByName[keyName] = parseInt(keyCode);
    }
    ensureKeyNameIsValid = function(keyName) {
      if (keyCodesByName[keyName] == null) {
        throw "\"" + keyName + "\" is not a valid key name.";
      }
    };
    return module = {
      keyNamesByCode: keyNamesByCode,
      keyCodesByName: keyCodesByName,
      createCurrentInput: function() {
        var currentInput;
        currentInput = {};
        window.addEventListener("keydown", function(keyDownEvent) {
          if (keyDownEvent.keyCode === keyCodesByName["down arrow"] || keyDownEvent.keyCode === keyCodesByName["up arrow"] || keyDownEvent.keyCode === keyCodesByName["right arrow"] || keyDownEvent.keyCode === keyCodesByName["left arrow"] || keyDownEvent.keyCode === keyCodesByName["space"]) {
            keyDownEvent.preventDefault();
          }
          return currentInput[keyNamesByCode[keyDownEvent.keyCode]] = true;
        });
        window.addEventListener("keyup", function(keyUpEvent) {
          return currentInput[keyNamesByCode[keyUpEvent.keyCode]] = false;
        });
        return currentInput;
      },
      isKeyDown: function(currentInput, keyName) {
        ensureKeyNameIsValid(keyName);
        return currentInput[keyName] === true;
      }
    };
  });

  define("Logic", ["ModifiedInput", "Entities", "ModifiedPhysics", "Vec2", "Transform2d", "Collisions"], function(Input, Entities, Physics, Vec2, Transform2d, Collisions) {
    var G, accelerationForce, addProgress, aiCountdown, amountOfDeath, amountOfRepair, angularVelocity, applyGravity, applyInput, bounds, checkPlanetCollision, createEntity, destroyEntity, detectCollisions, entityFactories, fuelBurn, fuelGain, halfPlanetSize, handleCollisions, highOrbitDistance, initialRocketDistance, inputMappings, manageFuel, module, mu, nextDeathSatelliteId, nextRepairSatelliteId, nextScoreSatelliteId, nextStarId, payloadSelection, planetSize, progressGain, updateAI, updateAIRocket;
    G = 5e4;
    mu = G;
    nextDeathSatelliteId = 0;
    nextRepairSatelliteId = 0;
    nextScoreSatelliteId = 0;
    nextStarId = 0;
    entityFactories = {
      "tinyPlanet": function(args) {
        var entity;
        return entity = {
          id: "tinyPlanet",
          components: {
            "positions": [0, 0],
            "imageIds": "images/tiny-world.png"
          }
        };
      },
      "star": function(args) {
        var entity, id, imageId, position, type;
        position = [Math.random() * 500 - 250, Math.random() * 500 - 250];
        type = Math.random() * 10 > 1 ? 1 : 2;
        imageId = "images/star" + type + ".png";
        id = "star" + nextStarId;
        nextStarId += 1;
        return entity = {
          id: id,
          components: {
            "positions": position,
            "imageIds": imageId
          }
        };
      },
      "deathSatellite": function(args) {
        var body, entity, id, satellite;
        body = Physics.createBody();
        body.position = args.position;
        body.velocity = args.velocity;
        satellite = {
          player: args.player,
          health: 100,
          maxHealth: 100
        };
        id = "deathSatellite" + nextDeathSatelliteId;
        nextDeathSatelliteId += 1;
        return entity = {
          id: id,
          components: {
            "bodies": body,
            "imageIds": "images/skull.png",
            "satellites": satellite,
            "shapes": "satellite",
            "deathSatellites": {}
          }
        };
      },
      "repairSatellite": function(args) {
        var body, entity, id, satellite;
        body = Physics.createBody();
        body.position = args.position;
        body.velocity = args.velocity;
        satellite = {
          player: args.player,
          health: 100,
          maxHealth: 100
        };
        id = "repairSatellite" + nextRepairSatelliteId;
        nextRepairSatelliteId += 1;
        return entity = {
          id: id,
          components: {
            "bodies": body,
            "imageIds": "images/red-cross.png",
            "satellites": satellite,
            "repairSatellites": {},
            "shapes": "satellite"
          }
        };
      },
      "scoreSatellite": function(args) {
        var body, entity, id, satellite;
        body = Physics.createBody();
        body.position = args.position;
        body.velocity = args.velocity;
        satellite = {
          player: args.player,
          health: 100,
          maxHealth: 100
        };
        id = "scoreSatellite" + nextScoreSatelliteId;
        nextScoreSatelliteId += 1;
        return entity = {
          id: id,
          components: {
            "bodies": body,
            "imageIds": "images/coin.png",
            "satellites": satellite,
            "shapes": "satellite",
            "scoreSatellites": {}
          }
        };
      },
      "rocket": function(args) {
        var body, entity, id, rocket;
        body = Physics.createBody();
        body.position = args.position;
        body.velocity = args.velocity;
        body.orientation = args.orientation;
        rocket = {
          accelerates: false,
          payload: args.payload,
          player: "" + args.player + "Player"
        };
        id = "" + args.player + "Rocket";
        return entity = {
          id: id,
          components: {
            "bodies": body,
            "rockets": rocket,
            "imageIds": "images/" + args.player + "-rocket.png"
          }
        };
      },
      "player": function(args) {
        var entity, player;
        player = {
          ai: false,
          color: args.color,
          selectedIndex: 0,
          selectedPayload: "deathSatellite",
          justSelected: false,
          progress: 0,
          maxProgress: 100,
          fuel: 0,
          maxFuel: 80,
          minFuel: 20,
          winner: ""
        };
        return entity = {
          id: "" + args.color + "Player",
          components: {
            players: player
          }
        };
      },
      "aiPlayer": function(args) {
        var entity, player;
        player = {
          ai: true,
          color: args.color,
          selectedIndex: 0,
          selectedPayload: "deathSatellite",
          justSelected: false,
          progress: 0,
          maxProgress: 100,
          fuel: 0,
          maxFuel: 80,
          minFuel: 20,
          winner: "",
          nextSatteliteChosen: false,
          nextOrbit: "low"
        };
        return entity = {
          id: "" + args.color + "Player",
          components: {
            players: player
          }
        };
      }
    };
    inputMappings = {
      "redRocket": {
        "left": "left arrow",
        "right": "right arrow",
        "up": "up arrow",
        "down": "down arrow"
      },
      "greenRocket": {
        "left": "a",
        "right": "d",
        "up": "w",
        "down": "s"
      },
      "redPlayer": {
        "launch": "space",
        "left": "left arrow",
        "right": "right arrow"
      },
      "greenPlayer": {
        "launch": "q",
        "left": "a",
        "right": "d"
      }
    };
    angularVelocity = 2;
    accelerationForce = 5;
    payloadSelection = ["deathSatellite", "repairSatellite", "scoreSatellite"];
    initialRocketDistance = 50;
    applyInput = function(currentInput, bodies, rockets, players, createEntity, destroyEntity, gameState) {
      var body, entityId, force, mapping, orbitAngle, orientation, player, position, rocket, rocketId, rotationTransform, velocity;
      for (entityId in rockets) {
        rocket = rockets[entityId];
        body = bodies[entityId];
        player = players[rocket.player];
        mapping = inputMappings[entityId];
        if (!player.ai) {
          body.angularVelocity = 0;
          if (Input.isKeyDown(currentInput, mapping["left"])) {
            body.angularVelocity = -angularVelocity;
          }
          if (Input.isKeyDown(currentInput, mapping["right"])) {
            body.angularVelocity = angularVelocity;
          }
          rocket.accelerates = false;
          if (Input.isKeyDown(currentInput, mapping["up"]) && player.fuel > 0) {
            force = [accelerationForce, 0];
            rotationTransform = Transform2d.rotationMatrix(body.orientation);
            Vec2.applyTransform(force, rotationTransform);
            body.forces.push(force);
            rocket.accelerates = true;
          }
          if (Input.isKeyDown(currentInput, mapping["down"])) {
            createEntity(rocket.payload, {
              position: body.position,
              velocity: body.velocity,
              player: rocket.player
            });
            destroyEntity(entityId);
            player.fuel = 0;
          }
        }
      }
      for (entityId in players) {
        player = players[entityId];
        if (!(player.ai !== true)) continue;
        rocketId = "" + player.color + "Rocket";
        mapping = inputMappings[entityId];
        if (rockets[rocketId] == null) {
          if (Input.isKeyDown(currentInput, mapping["launch"]) && player.fuel >= player.minFuel) {
            orbitAngle = Math.random() * Math.PI * 2;
            orientation = orbitAngle + Math.PI / 2;
            rotationTransform = Transform2d.rotationMatrix(orbitAngle);
            position = [initialRocketDistance, 0];
            Vec2.applyTransform(position, rotationTransform);
            rotationTransform = Transform2d.rotationMatrix(orientation);
            velocity = [30, 0];
            Vec2.applyTransform(velocity, rotationTransform);
            createEntity("rocket", {
              position: position,
              velocity: velocity,
              orientation: orientation,
              player: player.color,
              payload: player.selectedPayload
            });
          }
          if (player.justSelected) {
            if (!(Input.isKeyDown(currentInput, mapping["right"]) || Input.isKeyDown(currentInput, mapping["left"]))) {
              player.justSelected = false;
            }
          } else if (Input.isKeyDown(currentInput, mapping["right"]) || Input.isKeyDown(currentInput, mapping["left"])) {
            if (Input.isKeyDown(currentInput, mapping["right"])) {
              player.selectedIndex += 1;
            }
            if (Input.isKeyDown(currentInput, mapping["left"])) {
              player.selectedIndex -= 1;
            }
            player.selectedIndex = (player.selectedIndex + payloadSelection.length) % payloadSelection.length;
            player.selectedPayload = payloadSelection[player.selectedIndex];
            player.justSelected = true;
          }
        }
      }
      if (gameState.winner !== null) {
        if (Input.isKeyDown(currentInput, "enter")) return gameState.reset = true;
      }
    };
    applyGravity = function(bodies) {
      var body, entityId, force, forceMagnitude, squaredDistance, _results;
      _results = [];
      for (entityId in bodies) {
        body = bodies[entityId];
        squaredDistance = Vec2.squaredLength(body.position);
        forceMagnitude = G * body.mass / squaredDistance;
        force = Vec2.copy(body.position);
        Vec2.scale(force, -1);
        Vec2.unit(force);
        Vec2.scale(force, forceMagnitude);
        _results.push(body.forces.push(force));
      }
      return _results;
    };
    fuelBurn = 20;
    fuelGain = 2.5;
    manageFuel = function(players, rockets, passedTimeInS) {
      var entityId, player, rocket, rocketId, _results;
      _results = [];
      for (entityId in players) {
        player = players[entityId];
        rocketId = "" + player.color + "Rocket";
        rocket = rockets[rocketId];
        if (rocket != null) {
          if (rocket.accelerates) player.fuel -= fuelBurn * passedTimeInS;
          if (player.fuel < 0) {
            _results.push(player.fuel = 0);
          } else {
            _results.push(void 0);
          }
        } else {
          player.fuel += fuelGain * passedTimeInS;
          if (player.fuel > player.maxFuel) {
            _results.push(player.fuel = player.maxFuel);
          } else {
            _results.push(void 0);
          }
        }
      }
      return _results;
    };
    progressGain = 0.5;
    addProgress = function(scoreSatellites, satellites, players, passedTimeInS) {
      var entityId, player, satellite, scoreSatellite, _results;
      _results = [];
      for (entityId in scoreSatellites) {
        scoreSatellite = scoreSatellites[entityId];
        satellite = satellites[entityId];
        player = players[satellite.player];
        player.progress += progressGain * passedTimeInS;
        if (player.progress > player.maxProgress) {
          _results.push(player.progress = player.maxProgress);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    planetSize = 32;
    halfPlanetSize = planetSize / 2;
    bounds = 250;
    checkPlanetCollision = function(bodies, destroyEntity) {
      var body, entityId, _results;
      _results = [];
      for (entityId in bodies) {
        body = bodies[entityId];
        if (body.position[0] < halfPlanetSize && body.position[0] > -halfPlanetSize && body.position[1] < halfPlanetSize && body.position[1] > -halfPlanetSize) {
          destroyEntity(entityId);
        }
        if (body.position[0] < -bounds || body.position[0] > bounds || body.position[1] < -bounds || body.position[1] > bounds) {
          _results.push(destroyEntity(entityId));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    detectCollisions = function(bodies, shapes, shapeData) {
      var collision, collisions, contact, pair, pairs, pos1, pos2, shape1, shape2, _i, _len;
      collisions = [];
      pairs = Collisions.buildPairs(shapes);
      for (_i = 0, _len = pairs.length; _i < _len; _i++) {
        pair = pairs[_i];
        shape1 = shapeData[shapes[pair[0]]];
        shape2 = shapeData[shapes[pair[1]]];
        pos1 = Vec2.copy(bodies[pair[0]].position);
        pos2 = Vec2.copy(bodies[pair[1]].position);
        Vec2.add(pos1, shape1.offset);
        Vec2.add(pos2, shape2.offset);
        contact = Collisions.checkCollision(pos1, pos2, shape1.circle, shape2.circle);
        collision = {
          entityA: pair[0],
          entityB: pair[1],
          contact: contact
        };
        if (contact.touches) collisions.push(collision);
      }
      return collisions;
    };
    amountOfDeath = 10;
    amountOfRepair = 5;
    handleCollisions = function(collisions, satellites, deathSatellites, repairSatellites, bodies, passedTimeInS) {
      var bodyA, bodyB, collision, entitiesToDestroy, entityId, satellite, satelliteA, satelliteB, _i, _j, _len, _len2, _results;
      for (entityId in satellites) {
        satellite = satellites[entityId];
        satellite.isActive = false;
      }
      entitiesToDestroy = [];
      for (_i = 0, _len = collisions.length; _i < _len; _i++) {
        collision = collisions[_i];
        satelliteA = satellites[collision.entityA];
        satelliteB = satellites[collision.entityB];
        bodyA = bodies[collision.entityA];
        bodyB = bodies[collision.entityB];
        if (satelliteA.player === satelliteB.player) {
          if (repairSatellites[collision.entityA] != null) {
            satelliteA.isActive = true;
            satelliteA.target = bodyB.position;
            satelliteB.health += amountOfRepair * passedTimeInS;
            if (satelliteB.health > satelliteB.maxHealth) {
              satelliteB.health = satelliteB.maxHealth;
            }
          }
          if (repairSatellites[collision.entityB] != null) {
            satelliteB.isActive = true;
            satelliteB.target = bodyA.position;
            satelliteA.health += amountOfRepair * passedTimeInS;
            if (satelliteA.health > satelliteA.maxHealth) {
              satelliteA.health = satelliteA.maxHealth;
            }
          }
        } else {
          if (deathSatellites[collision.entityA] != null) {
            satelliteA.isActive = true;
            satelliteA.target = bodyB.position;
            satelliteB.health -= amountOfDeath * passedTimeInS;
            if (satelliteB.health <= 0) entitiesToDestroy.push(collision.entityB);
          }
          if (deathSatellites[collision.entityB] != null) {
            satelliteB.isActive = true;
            satelliteB.target = bodyA.position;
            satelliteA.health -= amountOfDeath * passedTimeInS;
            if (satelliteA.health <= 0) entitiesToDestroy.push(collision.entityA);
          }
        }
      }
      _results = [];
      for (_j = 0, _len2 = entitiesToDestroy.length; _j < _len2; _j++) {
        entityId = entitiesToDestroy[_j];
        _results.push(destroyEntity(entityId));
      }
      return _results;
    };
    highOrbitDistance = 190;
    updateAIRocket = function(players, rockets, bodies) {
      var aiPlayer, body, force, rocket, rocketId, rotationTransform;
      aiPlayer = players["greenPlayer"];
      rocketId = "" + aiPlayer.color + "Rocket";
      rocket = rockets[rocketId];
      if (rocket != null) {
        body = bodies[rocketId];
        body.orientation = Math.atan2(body.position[1], body.position[0]) + Math.PI / 2;
        rocket.accelerates = false;
        if (aiPlayer.nextOrbit === "low") {
          createEntity(rocket.payload, {
            position: body.position,
            velocity: body.velocity,
            player: rocket.player
          });
          destroyEntity(rocketId);
          aiPlayer.fuel = 0;
        }
        if (aiPlayer.nextOrbit === "transfer") {
          if (aiPlayer.fuel > 10) {
            force = [accelerationForce, 0];
            rotationTransform = Transform2d.rotationMatrix(body.orientation);
            Vec2.applyTransform(force, rotationTransform);
            body.forces.push(force);
            rocket.accelerates = true;
          } else {
            createEntity(rocket.payload, {
              position: body.position,
              velocity: body.velocity,
              player: rocket.player
            });
            destroyEntity(rocketId);
            aiPlayer.fuel = 0;
          }
        }
        if (aiPlayer.nextOrbit === "high") {
          if (aiPlayer.fuel > 40) {
            force = [accelerationForce, 0];
            rotationTransform = Transform2d.rotationMatrix(body.orientation);
            Vec2.applyTransform(force, rotationTransform);
            body.forces.push(force);
            return rocket.accelerates = true;
          } else if (aiPlayer.fuel > 20 && Vec2.squaredLength(body.position) > highOrbitDistance * highOrbitDistance) {
            force = [accelerationForce, 0];
            rotationTransform = Transform2d.rotationMatrix(body.orientation);
            Vec2.applyTransform(force, rotationTransform);
            body.forces.push(force);
            return rocket.accelerates = true;
          } else if (aiPlayer.fuel <= 20) {
            createEntity(rocket.payload, {
              position: body.position,
              velocity: body.velocity,
              player: rocket.player
            });
            destroyEntity(rocketId);
            return aiPlayer.fuel = 0;
          }
        }
      }
    };
    updateAI = function(players, satellites, deathSatellites, repairSatellites, scoreSatellites, rockets, bodies) {
      var aiPlayer, deathSatelliteChance, entityId, index, nextSatellite, numberOfEnemyDeathSatellites, numberOfEnemyRepairSattelites, numberOfEnemyScoreSatellites, numberOfOwnDeathSatellites, numberOfOwnRepairSatellites, numberOfOwnScoreSatellites, orbitAngle, orbitFuelRequirement, orientation, payload, position, r, repairSatelliteChance, rotationTransform, satellite, scoreSatelliteChance, velocity, _len;
      aiPlayer = players["greenPlayer"];
      if (rockets["" + aiPlayer.color + "Rocket"] == null) {
        if (aiPlayer.nextSatteliteChosen) {
          orbitFuelRequirement = {
            "low": aiPlayer.minFuel,
            "transfer": 50,
            "high": aiPlayer.maxFuel
          };
          if (aiPlayer.fuel >= orbitFuelRequirement[aiPlayer.nextOrbit]) {
            orbitAngle = Math.random() * Math.PI * 2;
            orientation = orbitAngle + Math.PI / 2;
            rotationTransform = Transform2d.rotationMatrix(orbitAngle);
            position = [initialRocketDistance, 0];
            Vec2.applyTransform(position, rotationTransform);
            rotationTransform = Transform2d.rotationMatrix(orientation);
            velocity = [30, 0];
            Vec2.applyTransform(velocity, rotationTransform);
            createEntity("rocket", {
              position: position,
              velocity: velocity,
              orientation: orientation,
              player: aiPlayer.color,
              payload: aiPlayer.selectedPayload
            });
            return aiPlayer.nextSatteliteChosen = false;
          }
        } else {
          numberOfEnemyDeathSatellites = 0;
          numberOfEnemyRepairSattelites = 0;
          numberOfEnemyScoreSatellites = 0;
          numberOfOwnDeathSatellites = 0;
          numberOfOwnRepairSatellites = 0;
          numberOfOwnScoreSatellites = 0;
          for (entityId in satellites) {
            satellite = satellites[entityId];
            if (satellite.player === "redPlayer") {
              if (deathSatellites[entityId] != null) {
                numberOfEnemyDeathSatellites += 1;
              }
              if (repairSatellites[entityId] != null) {
                numberOfEnemyRepairSattelites += 1;
              }
              if (scoreSatellites[entityId] != null) {
                numberOfEnemyScoreSatellites += 1;
              }
            } else {
              if (deathSatellites[entityId] != null) {
                numberOfOwnDeathSatellites += 1;
              }
              if (repairSatellites[entityId] != null) {
                numberOfOwnRepairSatellites += 1;
              }
              if (scoreSatellites[entityId] != null) {
                numberOfOwnScoreSatellites += 1;
              }
            }
          }
          deathSatelliteChance = 1.5 * (numberOfEnemyDeathSatellites + numberOfEnemyRepairSattelites * 0.5 + numberOfEnemyScoreSatellites * 4);
          repairSatelliteChance = 0.5 * (numberOfOwnDeathSatellites + numberOfOwnScoreSatellites + numberOfEnemyRepairSattelites * 0.5 + numberOfEnemyDeathSatellites * 2);
          scoreSatelliteChance = 1 * (1 + numberOfEnemyScoreSatellites * 3);
          repairSatelliteChance += deathSatelliteChance;
          scoreSatelliteChance += repairSatelliteChance;
          r = Math.random() * scoreSatelliteChance;
          nextSatellite = (function() {
            if (r < deathSatelliteChance) {
              return "deathSatellite";
            } else if (r >= deathSatelliteChance && r < repairSatelliteChance) {
              return "repairSatellite";
            } else if (r >= repairSatelliteChance && r < scoreSatelliteChance) {
              return "scoreSatellite";
            } else {
              throw "Invalid next satellite selected.";
            }
          })();
          aiPlayer.selectedPayload = nextSatellite;
          aiPlayer.selectedIndex = -1;
          for (index = 0, _len = payloadSelection.length; index < _len; index++) {
            payload = payloadSelection[index];
            if (payload === nextSatellite) aiPlayer.selectedIndex = index;
          }
          if (aiPlayer.selectedIndex === -1) throw "Invalid index selected.";
          if (nextSatellite === "deathSatellite") {
            r = Math.random() * 4;
            aiPlayer.nextOrbit = r < 1 ? "low" : "transfer";
          }
          if (nextSatellite === "repairSatellite") {
            r = Math.random() * 4;
            aiPlayer.nextOrbit = r < 1 ? "low" : "transfer";
          }
          if (nextSatellite === "scoreSatellite") aiPlayer.nextOrbit = "high";
          return aiPlayer.nextSatteliteChosen = true;
        }
      }
    };
    createEntity = null;
    destroyEntity = null;
    aiCountdown = 0;
    return module = {
      createGameState: function() {
        var gameState;
        return gameState = {
          winner: null,
          reset: false,
          components: {
            positions: {},
            bodies: {},
            imageIds: {},
            rockets: {},
            players: {},
            satellites: {},
            shapes: {},
            deathSatellites: {},
            scoreSatellites: {},
            repairSatellites: {}
          }
        };
      },
      initGameState: function(gameState) {
        var i;
        createEntity = function(type, args) {
          return Entities.createEntity(entityFactories, gameState.components, type, args);
        };
        destroyEntity = function(entityId) {
          return Entities.destroyEntity(gameState.components, entityId);
        };
        for (i = 1; i <= 100; i++) {
          createEntity("star");
        }
        createEntity("tinyPlanet", {});
        createEntity("player", {
          color: "red"
        });
        return createEntity("aiPlayer", {
          color: "green"
        });
      },
      updateGameState: function(gameState, currentInput, timeInS, passedTimeInS, shapeData) {
        var collisions, entityId, player, _ref, _results;
        applyInput(currentInput, gameState.components.bodies, gameState.components.rockets, gameState.components.players, createEntity, destroyEntity, gameState);
        manageFuel(gameState.components.players, gameState.components.rockets, passedTimeInS);
        applyGravity(gameState.components.bodies);
        Physics.update(gameState.components.bodies, passedTimeInS);
        checkPlanetCollision(gameState.components.bodies, destroyEntity);
        addProgress(gameState.components.scoreSatellites, gameState.components.satellites, gameState.components.players, passedTimeInS);
        collisions = detectCollisions(gameState.components.bodies, gameState.components.shapes, shapeData);
        handleCollisions(collisions, gameState.components.satellites, gameState.components.deathSatellites, gameState.components.repairSatellites, gameState.components.bodies, passedTimeInS);
        updateAIRocket(gameState.components.players, gameState.components.rockets, gameState.components.bodies);
        aiCountdown -= passedTimeInS;
        if (aiCountdown <= 0) {
          aiCountdown = 1;
          updateAI(gameState.components.players, gameState.components.satellites, gameState.components.deathSatellites, gameState.components.repairSatellites, gameState.components.scoreSatellites, gameState.components.rockets, gameState.components.bodies);
        }
        if (gameState.winner === null) {
          _ref = gameState.components.players;
          _results = [];
          for (entityId in _ref) {
            player = _ref[entityId];
            if (player.progress >= player.maxProgress) {
              _results.push(gameState.winner = entityId);
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        }
      }
    };
  });

  define("Game", ["ModifiedRendering", "ModifiedInput", "Logic", "Graphics", "Collisions"], function(Rendering, Input, Logic, Graphics, Collisions) {
    var module, requestAnimFrame;
    requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
      return window.setTimeout(function() {
        return callback(Date.now());
      }, 1000 / 60);
    };
    return module = {
      itIsAwesome: true,
      imagePaths: ["images/coin.png", "images/exhaust.png", "images/green-rocket.png", "images/red-cross.png", "images/red-rocket.png", "images/rocket.png", "images/skull.png", "images/star1.png", "images/star2.png", "images/tiny-world.png"],
      initGame: function(images) {
        var currentInput, display, gameState, lastTimeInMs, main, renderData, renderState, shapeData;
        images["images/green-rocket.png"].orientationOffset = Math.PI / 2;
        images["images/red-rocket.png"].orientationOffset = Math.PI / 2;
        images["images/exhaust.png"].orientationOffset = Math.PI / 2;
        shapeData = {
          "satellite": {
            circle: Collisions.createCircle(30),
            offset: [0, 0]
          }
        };
        renderData = {
          "image": images,
          "circle": shapeData
        };
        display = Rendering.createDisplay();
        currentInput = Input.createCurrentInput();
        gameState = Logic.createGameState();
        renderState = Graphics.createRenderState();
        Logic.initGameState(gameState);
        lastTimeInMs = Date.now();
        main = function(timeInMs) {
          var passedTimeInMs, passedTimeInS, timeInS;
          passedTimeInMs = timeInMs - lastTimeInMs;
          if (passedTimeInMs > 1000 / 30) passedTimeInMs = 1000 / 30;
          timeInS = timeInMs / 1000;
          passedTimeInS = passedTimeInMs / 1000;
          lastTimeInMs = timeInMs;
          Logic.updateGameState(gameState, currentInput, timeInS, passedTimeInS, shapeData);
          Graphics.updateRenderState(renderState, gameState);
          Rendering.render(display, renderData, renderState.renderables);
          if (gameState.reset) {
            gameState = Logic.createGameState();
            Logic.initGameState(gameState);
          }
          return requestAnimFrame(main);
        };
        return main(lastTimeInMs);
      }
    };
  });

  define("Graphics", ["ModifiedRendering", "Camera", "Vec2", "Transform2d"], function(Rendering, Camera, Vec2, Transform2d) {
    var module, mu, payloadImageIds, playerUI;
    mu = 5e4;
    playerUI = {
      "redPlayer": {
        position: [100, -250],
        header: "Red",
        color: "rgb(255,0,0)",
        payloadKeys: "left/right",
        launchKey: "space",
        leftRightKeys: "left/right",
        accelerateKey: "up",
        deployKey: "down",
        winPosition: [-50, 30]
      },
      "greenPlayer": {
        position: [-250, -250],
        header: "Green",
        color: "rgb(0,255,0)",
        payloadKeys: "a/d",
        launchKey: "q",
        leftRightKeys: "a/d",
        accelerateKey: "w",
        deployKey: "s",
        winPosition: [-70, 30]
      }
    };
    payloadImageIds = {
      "deathSatellite": "images/skull.png",
      "repairSatellite": "images/red-cross.png",
      "scoreSatellite": "images/coin.png"
    };
    return module = {
      createRenderState: function() {
        var renderState;
        return renderState = {
          camera: Camera.createCamera(),
          renderables: []
        };
      },
      updateRenderState: function(renderState, gameState) {
        var a, b, body, color, distance, eccentricity, eccentricityVector, entityId, focalDistance, focalToCenter, header, imageId, launchText, orientation, player, position, renderable, rocket, rocketId, rotationTransform, satellite, semiMajorAxis, semiMinorAxis, shapeId, speed, tmp, ui, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
        renderState.renderables.length = 0;
        _ref = gameState.components.satellites;
        for (entityId in _ref) {
          satellite = _ref[entityId];
          body = gameState.components.bodies[entityId];
          speed = Vec2.length(body.velocity);
          distance = Vec2.length(body.position);
          semiMajorAxis = -mu / 2 / (speed * speed / 2 - mu / distance);
          eccentricityVector = Vec2.copy(body.position);
          Vec2.scale(eccentricityVector, speed * speed / mu);
          tmp = Vec2.copy(body.velocity);
          Vec2.scale(tmp, Vec2.dot(body.position, body.velocity) / mu);
          Vec2.subtract(eccentricityVector, tmp);
          tmp = Vec2.copy(body.position);
          Vec2.scale(tmp, 1 / distance);
          Vec2.subtract(eccentricityVector, tmp);
          eccentricity = Vec2.length(eccentricityVector);
          semiMinorAxis = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity);
          a = semiMajorAxis;
          b = semiMinorAxis;
          focalDistance = Math.sqrt(a * a - b * b);
          focalToCenter = Vec2.copy(eccentricityVector);
          Vec2.unit(focalToCenter);
          Vec2.scale(focalToCenter, -focalDistance);
          orientation = Math.atan2(focalToCenter[1], focalToCenter[0]);
          renderable = Rendering.createRenderable("ellipse");
          renderable.position = focalToCenter;
          renderable.orientation = orientation;
          renderable.ellipse = {
            color: "rgb(80,80,80)",
            semiMajorAxis: semiMajorAxis,
            semiMinorAxis: semiMinorAxis
          };
          renderState.renderables.push(renderable);
        }
        _ref2 = gameState.components.rockets;
        for (entityId in _ref2) {
          rocket = _ref2[entityId];
          body = gameState.components.bodies[entityId];
          speed = Vec2.length(body.velocity);
          distance = Vec2.length(body.position);
          semiMajorAxis = -mu / 2 / (speed * speed / 2 - mu / distance);
          eccentricityVector = Vec2.copy(body.position);
          Vec2.scale(eccentricityVector, speed * speed / mu);
          tmp = Vec2.copy(body.velocity);
          Vec2.scale(tmp, Vec2.dot(body.position, body.velocity) / mu);
          Vec2.subtract(eccentricityVector, tmp);
          tmp = Vec2.copy(body.position);
          Vec2.scale(tmp, 1 / distance);
          Vec2.subtract(eccentricityVector, tmp);
          eccentricity = Vec2.length(eccentricityVector);
          semiMinorAxis = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity);
          a = semiMajorAxis;
          b = semiMinorAxis;
          focalDistance = Math.sqrt(a * a - b * b);
          focalToCenter = Vec2.copy(eccentricityVector);
          Vec2.unit(focalToCenter);
          Vec2.scale(focalToCenter, -focalDistance);
          orientation = Math.atan2(focalToCenter[1], focalToCenter[0]);
          if (entityId === "redRocket") color = "rgb(255,0,0)";
          if (entityId === "greenRocket") color = "rgb(0,255,0)";
          renderable = Rendering.createRenderable("ellipse");
          renderable.position = focalToCenter;
          renderable.orientation = orientation;
          renderable.ellipse = {
            color: color,
            semiMajorAxis: semiMajorAxis,
            semiMinorAxis: semiMinorAxis
          };
          renderState.renderables.push(renderable);
        }
        _ref3 = gameState.components.positions;
        for (entityId in _ref3) {
          position = _ref3[entityId];
          imageId = gameState.components.imageIds[entityId];
          renderable = Rendering.createRenderable("image", imageId);
          renderable.position = Vec2.copy(position);
          renderState.renderables.push(renderable);
        }
        _ref4 = gameState.components.bodies;
        for (entityId in _ref4) {
          body = _ref4[entityId];
          imageId = gameState.components.imageIds[entityId];
          renderable = Rendering.createRenderable("image", imageId);
          renderable.position = Vec2.copy(body.position);
          renderable.orientation = body.orientation;
          renderState.renderables.push(renderable);
        }
        _ref5 = gameState.components.rockets;
        for (entityId in _ref5) {
          rocket = _ref5[entityId];
          body = gameState.components.bodies[entityId];
          if (rocket.accelerates) {
            rotationTransform = Transform2d.rotationMatrix(body.orientation);
            position = [-13, 0];
            Vec2.applyTransform(position, rotationTransform);
            Vec2.add(position, body.position);
            renderable = Rendering.createRenderable("image", "images/exhaust.png");
            renderable.position = position;
            renderable.orientation = body.orientation;
            renderState.renderables.push(renderable);
          }
        }
        _ref6 = gameState.components.satellites;
        for (entityId in _ref6) {
          satellite = _ref6[entityId];
          if (satellite.isActive) {
            body = gameState.components.bodies[entityId];
            shapeId = gameState.components.shapes[entityId];
            renderable = Rendering.createRenderable("line");
            renderable.start = body.position;
            renderable.end = satellite.target;
            renderState.renderables.push(renderable);
          }
        }
        _ref7 = gameState.components.satellites;
        for (entityId in _ref7) {
          satellite = _ref7[entityId];
          body = gameState.components.bodies[entityId];
          ui = playerUI[satellite.player];
          position = Vec2.copy(body.position);
          Vec2.add(position, [-6, -14]);
          renderable = Rendering.createRenderable("rectangle");
          renderable.position = position;
          renderable.size = [satellite.health / satellite.maxHealth * 12, 4];
          renderable.color = ui.color;
          renderState.renderables.push(renderable);
        }
        Camera.transformRenderables(renderState.camera, renderState.renderables);
        _ref8 = gameState.components.players;
        for (entityId in _ref8) {
          player = _ref8[entityId];
          ui = playerUI[entityId];
          rocketId = "" + player.color + "Rocket";
          renderable = Rendering.createRenderable("rectangle");
          renderable.position = ui.position;
          renderable.size = [150, 100];
          renderable.color = "rgba(255,255,255,0.5)";
          renderState.renderables.push(renderable);
          header = player.ai ? "" + ui.header + " (AI)" : ui.header;
          renderable = Rendering.createRenderable("text");
          renderable.position = [ui.position[0] + 10, ui.position[1] + 10];
          renderable.text = header;
          renderable.color = ui.color;
          renderable.bold = true;
          renderState.renderables.push(renderable);
          renderable = Rendering.createRenderable("text");
          renderable.position = [ui.position[0] + 10, ui.position[1] + 25];
          renderable.text = "Progress:";
          renderState.renderables.push(renderable);
          renderable = Rendering.createRenderable("hollowRectangle");
          renderable.position = [ui.position[0] + 60, ui.position[1] + 17];
          renderable.size = [80, 10];
          renderState.renderables.push(renderable);
          renderable = Rendering.createRenderable("rectangle");
          renderable.position = [ui.position[0] + 61, ui.position[1] + 18];
          renderable.size = [player.progress / player.maxProgress * 78, 8];
          renderable.color = ui.color;
          renderState.renderables.push(renderable);
          renderable = Rendering.createRenderable("text");
          renderable.position = [ui.position[0] + 10, ui.position[1] + 40];
          renderable.text = "Fuel:";
          renderState.renderables.push(renderable);
          renderable = Rendering.createRenderable("hollowRectangle");
          renderable.position = [ui.position[0] + 60, ui.position[1] + 32];
          renderable.size = [80, 10];
          renderState.renderables.push(renderable);
          renderable = Rendering.createRenderable("rectangle");
          renderable.position = [ui.position[0] + 61, ui.position[1] + 33];
          renderable.size = [player.fuel / player.maxFuel * 78, 8];
          renderable.color = ui.color;
          renderState.renderables.push(renderable);
          if (gameState.components.rockets[rocketId] != null) {
            if (player.ai) {} else {
              renderable = Rendering.createRenderable("text");
              renderable.position = [ui.position[0] + 10, ui.position[1] + 60];
              renderable.text = "" + ui.leftRightKeys;
              renderable.bold = true;
              renderState.renderables.push(renderable);
              renderable = Rendering.createRenderable("text");
              renderable.position = [ui.position[0] + 70, ui.position[1] + 60];
              renderable.text = "for steering";
              renderState.renderables.push(renderable);
              renderable = Rendering.createRenderable("text");
              renderable.position = [ui.position[0] + 10, ui.position[1] + 75];
              renderable.text = "" + ui.accelerateKey;
              renderable.bold = true;
              renderState.renderables.push(renderable);
              renderable = Rendering.createRenderable("text");
              renderable.position = [ui.position[0] + 70, ui.position[1] + 75];
              renderable.text = "for acceleration";
              renderState.renderables.push(renderable);
              renderable = Rendering.createRenderable("text");
              renderable.position = [ui.position[0] + 10, ui.position[1] + 90];
              renderable.text = "" + ui.deployKey;
              renderable.bold = true;
              renderState.renderables.push(renderable);
              renderable = Rendering.createRenderable("text");
              renderable.position = [ui.position[0] + 70, ui.position[1] + 90];
              renderable.text = "for deployment";
              renderState.renderables.push(renderable);
            }
          } else {
            if (player.ai) {
              renderable = Rendering.createRenderable("text");
              renderable.position = [ui.position[0] + 10, ui.position[1] + 60];
              renderable.text = "Next payload:";
              renderState.renderables.push(renderable);
              renderable = Rendering.createRenderable("image", "images/skull.png");
              renderable.position = [ui.position[0] + 60, ui.position[1] + 73];
              renderState.renderables.push(renderable);
              renderable = Rendering.createRenderable("image", "images/red-cross.png");
              renderable.position = [ui.position[0] + 80, ui.position[1] + 73];
              renderState.renderables.push(renderable);
              renderable = Rendering.createRenderable("image", "images/coin.png");
              renderable.position = [ui.position[0] + 100, ui.position[1] + 73];
              renderState.renderables.push(renderable);
              renderable = Rendering.createRenderable("hollowRectangle");
              renderable.position = [ui.position[0] + 52 + (20 * player.selectedIndex), ui.position[1] + 65];
              renderable.size = [16, 16];
              renderState.renderables.push(renderable);
            } else {
              renderable = Rendering.createRenderable("text");
              renderable.position = [ui.position[0] + 10, ui.position[1] + 60];
              renderable.text = "Select payload (use " + ui.payloadKeys + "):";
              renderState.renderables.push(renderable);
              renderable = Rendering.createRenderable("image", "images/skull.png");
              renderable.position = [ui.position[0] + 60, ui.position[1] + 73];
              renderState.renderables.push(renderable);
              renderable = Rendering.createRenderable("image", "images/red-cross.png");
              renderable.position = [ui.position[0] + 80, ui.position[1] + 73];
              renderState.renderables.push(renderable);
              renderable = Rendering.createRenderable("image", "images/coin.png");
              renderable.position = [ui.position[0] + 100, ui.position[1] + 73];
              renderState.renderables.push(renderable);
              renderable = Rendering.createRenderable("hollowRectangle");
              renderable.position = [ui.position[0] + 52 + (20 * player.selectedIndex), ui.position[1] + 65];
              renderable.size = [16, 16];
              renderState.renderables.push(renderable);
              launchText = player.fuel >= player.minFuel ? "Press " + ui.launchKey + " to launch!" : "Not enough fuel!";
              renderable = Rendering.createRenderable("text");
              renderable.position = [ui.position[0] + 10, ui.position[1] + 95];
              renderable.text = launchText;
              renderState.renderables.push(renderable);
            }
          }
        }
        if (gameState.winner !== null) {
          ui = playerUI[gameState.winner];
          renderable = Rendering.createRenderable("text");
          renderable.position = [-180, -30];
          renderable.text = "The winner is:";
          renderable.font = "bold 50px sans-serif";
          renderable.color = "rgb(255,255,255)";
          renderState.renderables.push(renderable);
          renderable = Rendering.createRenderable("text");
          renderable.position = ui.winPosition;
          renderable.text = ui.header;
          renderable.font = "bold 50px sans-serif";
          renderable.color = ui.color;
          renderState.renderables.push(renderable);
          renderable = Rendering.createRenderable("text");
          renderable.position = [-175, 70];
          renderable.text = "(press enter to restart)";
          renderable.font = "bold 30px sans-serif";
          renderable.color = "rgb(255,255,255)";
          return renderState.renderables.push(renderable);
        }
      }
    };
  });

}).call(this);
