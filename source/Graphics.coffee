define "Graphics", [ "Rendering", "Camera", "Vec2" ], ( Rendering, Camera, Vec2 ) ->
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


			Camera.transformRenderables(
				renderState.camera,
				renderState.renderables )
