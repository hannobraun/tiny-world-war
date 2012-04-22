define "Graphics", [ "ModifiedRendering", "Camera", "Vec2", "Transform2d" ], ( Rendering, Camera, Vec2, Transform2d ) ->
	mu = 5e4

	playerUI =
		"redPlayer":
			position     : [ 100, -250 ]
			header       : "Red"
			color        : "rgb(255,0,0)"
			payloadKeys  : "left/right"
			launchKey    : "ctrl"
			leftRightKeys: "left/right"
			accelerateKey: "up"
			deployKey    : "down"
		"greenPlayer":
			position     : [ -250, -250 ]
			header       : "Green"
			color        : "rgb(0,255,0)"
			payloadKeys  : "a/d"
			launchKey    : "q"
			leftRightKeys: "a/d"
			accelerateKey: "w"
			deployKey    : "s"

	payloadImageIds =
		"deathSatellite" : "images/skull.png"
		"repairSatellite": "images/red-cross.png"
		"scoreSatellite" : "images/coin.png"

	module =
		createRenderState: ->
			renderState =
				camera: Camera.createCamera()
				renderables: []

		updateRenderState: ( renderState, gameState ) ->
			renderState.camera.position = Vec2.copy( gameState.focus )


			renderState.renderables.length = 0

			for entityId, rocket of gameState.components.rockets
				body = gameState.components.bodies[ entityId ]

				speed    = Vec2.length( body.velocity )
				distance = Vec2.length( body.position )

				semiMajorAxis = -mu / 2 / ( speed*speed / 2 - mu / distance )

				eccentricityVector = Vec2.copy( body.position )
				Vec2.scale( eccentricityVector, speed*speed / mu )
				tmp = Vec2.copy( body.velocity )
				Vec2.scale( tmp, Vec2.dot( body.position, body.velocity ) / mu )
				Vec2.subtract( eccentricityVector, tmp )
				tmp = Vec2.copy( body.position )
				Vec2.scale( tmp, 1 / distance )
				Vec2.subtract( eccentricityVector, tmp )

				eccentricity = Vec2.length( eccentricityVector )

				semiMinorAxis = semiMajorAxis * Math.sqrt( 1 - eccentricity*eccentricity )

				a = semiMajorAxis
				b = semiMinorAxis
				focalDistance = Math.sqrt( a*a - b*b )

				focalToCenter = Vec2.copy( eccentricityVector )
				Vec2.unit( focalToCenter )
				Vec2.scale( focalToCenter, -focalDistance )

				orientation = Math.atan2(
					focalToCenter[ 1 ],
					focalToCenter[ 0 ] )

				color = "rgb(255,0,0)" if entityId == "redRocket"
				color = "rgb(0,255,0)" if entityId == "greenRocket"

				renderable = Rendering.createRenderable( "ellipse" )
				renderable.position = focalToCenter
				renderable.orientation = orientation
				renderable.ellipse =
					color        : color
					semiMajorAxis: semiMajorAxis
					semiMinorAxis: semiMinorAxis

				renderState.renderables.push( renderable )

			for entityId, position of gameState.components.positions
				imageId = gameState.components.imageIds[ entityId ]

				renderable = Rendering.createRenderable( "image", imageId )
				renderable.position = Vec2.copy( position )

				renderState.renderables.push( renderable )

			for entityId, body of gameState.components.bodies
				imageId = gameState.components.imageIds[ entityId ]

				renderable = Rendering.createRenderable( "image", imageId )
				renderable.position    = Vec2.copy( body.position )
				renderable.orientation = body.orientation

				renderState.renderables.push( renderable )

			for entityId, rocket of gameState.components.rockets
				body = gameState.components.bodies[ entityId ]

				if rocket.accelerates
					rotationTransform = Transform2d.rotationMatrix(
						body.orientation )
					position = [ -13, 0 ]
					Vec2.applyTransform( position, rotationTransform )
					Vec2.add( position, body.position )

					renderable = Rendering.createRenderable(
						"image",
						"images/exhaust.png" )
					renderable.position    = position
					renderable.orientation = body.orientation

					renderState.renderables.push( renderable )
					 

			Camera.transformRenderables(
				renderState.camera,
				renderState.renderables )


			for entityId, player of gameState.components.players
				ui = playerUI[ entityId ]
				rocketId = "#{ player.color }Rocket"

				renderable = Rendering.createRenderable( "rectangle" )
				renderable.position = ui.position
				renderable.size = [ 150, 100 ]
				renderState.renderables.push( renderable )

				renderable = Rendering.createRenderable( "text" )
				renderable.position = [ ui.position[ 0 ] + 10, ui.position[ 1 ] + 10 ]
				renderable.text = ui.header
				renderable.color = ui.color
				renderState.renderables.push( renderable )

				renderable = Rendering.createRenderable( "text" )
				renderable.position = [ ui.position[ 0 ] + 10, ui.position[ 1 ] + 25 ]
				renderable.text = "Progress:"
				renderState.renderables.push( renderable )

				renderable = Rendering.createRenderable( "hollowRectangle" )
				renderable.position = [ ui.position[ 0 ] + 60, ui.position[ 1 ] + 17 ]
				renderable.size = [ 80, 10 ]
				renderState.renderables.push( renderable )

				renderable = Rendering.createRenderable( "rectangle" )
				renderable.position = [ ui.position[ 0 ] + 61, ui.position[ 1 ] + 18 ]
				renderable.size = [ player.progress / 100 * 78, 8 ]
				renderable.color = ui.color
				renderState.renderables.push( renderable )

				renderable = Rendering.createRenderable( "text" )
				renderable.position = [ ui.position[ 0 ] + 10, ui.position[ 1 ] + 40 ]
				renderable.text = "Fuel:"
				renderState.renderables.push( renderable )

				renderable = Rendering.createRenderable( "hollowRectangle" )
				renderable.position = [ ui.position[ 0 ] + 60, ui.position[ 1 ] + 32 ]
				renderable.size = [ 80, 10 ]
				renderState.renderables.push( renderable )

				renderable = Rendering.createRenderable( "rectangle" )
				renderable.position = [ ui.position[ 0 ] + 61, ui.position[ 1 ] + 33 ]
				renderable.size = [ player.fuel / player.maxFuel * 78, 8 ]
				renderable.color = ui.color
				renderState.renderables.push( renderable )


				if gameState.components.rockets[ rocketId ]?
					renderable = Rendering.createRenderable( "text" )
					renderable.position = [ ui.position[ 0 ] + 10, ui.position[ 1 ] + 60 ]
					renderable.text = "#{ ui.leftRightKeys }"
					renderable.bold = true
					renderState.renderables.push( renderable )

					renderable = Rendering.createRenderable( "text" )
					renderable.position = [ ui.position[ 0 ] + 70, ui.position[ 1 ] + 60 ]
					renderable.text = "for steering"
					renderState.renderables.push( renderable )

					renderable = Rendering.createRenderable( "text" )
					renderable.position = [ ui.position[ 0 ] + 10, ui.position[ 1 ] + 75 ]
					renderable.text = "#{ ui.accelerateKey }"
					renderable.bold = true
					renderState.renderables.push( renderable )

					renderable = Rendering.createRenderable( "text" )
					renderable.position = [ ui.position[ 0 ] + 70, ui.position[ 1 ] + 75 ]
					renderable.text = "for acceleration"
					renderState.renderables.push( renderable )

					renderable = Rendering.createRenderable( "text" )
					renderable.position = [ ui.position[ 0 ] + 10, ui.position[ 1 ] + 90 ]
					renderable.text = "#{ ui.deployKey }"
					renderable.bold = true
					renderState.renderables.push( renderable )

					renderable = Rendering.createRenderable( "text" )
					renderable.position = [ ui.position[ 0 ] + 70, ui.position[ 1 ] + 90 ]
					renderable.text = "for deployment"
					renderState.renderables.push( renderable )
				else
					renderable = Rendering.createRenderable( "text" )
					renderable.position = [ ui.position[ 0 ] + 10, ui.position[ 1 ] + 60 ]
					renderable.text = "Select payload (use #{ ui.payloadKeys }):"
					renderState.renderables.push( renderable )

					renderable = Rendering.createRenderable( "image", "images/skull.png" )
					renderable.position = [ ui.position[ 0 ] + 60, ui.position[ 1 ] + 73 ]
					renderState.renderables.push( renderable )

					renderable = Rendering.createRenderable( "image", "images/red-cross.png" )
					renderable.position = [ ui.position[ 0 ] + 80, ui.position[ 1 ] + 73 ]
					renderState.renderables.push( renderable )

					renderable = Rendering.createRenderable( "image", "images/coin.png" )
					renderable.position = [ ui.position[ 0 ] + 100, ui.position[ 1 ] + 73 ]
					renderState.renderables.push( renderable )

					renderable = Rendering.createRenderable( "hollowRectangle" )
					renderable.position = [ ui.position[ 0 ] + 52 + ( 20*player.selectedIndex ), ui.position[ 1 ] + 65 ]
					renderable.size = [ 16, 16 ]
					renderState.renderables.push( renderable )

					renderable = Rendering.createRenderable( "text" )
					renderable.position = [ ui.position[ 0 ] + 10, ui.position[ 1 ] + 95 ]
					renderable.text = "Enough fuel? Press #{ ui.launchKey }!"
					renderState.renderables.push( renderable )
