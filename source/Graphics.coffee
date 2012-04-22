define "Graphics", [ "Rendering", "Camera", "Vec2", "Transform2d" ], ( Rendering, Camera, Vec2, Transform2d ) ->
	module =
		createRenderState: ->
			renderState =
				camera: Camera.createCamera()
				renderables: []

		updateRenderState: ( renderState, gameState ) ->
			renderState.camera.position = Vec2.copy( gameState.focus )


			renderState.renderables.length = 0

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
