define "Graphics", [ "ModifiedRendering", "Camera", "Vec2", "Transform2d" ], ( Rendering, Camera, Vec2, Transform2d ) ->
	mu = 5e4

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
