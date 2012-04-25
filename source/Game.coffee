# noop's Loader module expects a module named "Game" to exist. Loader will load
# all images specified in imagePaths and pass them to initGame.
define "Game", [ "ModifiedRendering", "ModifiedInput", "Logic", "Graphics", "Collisions" ], ( Rendering, Input, Logic, Graphics, Collisions )->
	requestAnimFrame = window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		( callback ) ->
			window.setTimeout( callback, 1000 / 60 )

	module =
		# You can ignore this. It's just part of the example for how to set up
		# unit tests. See test directory.
		itIsAwesome: true

		# Images that you want to use should be defined here. They will be
		# loaded by noop's Loader module and passed into the initGame function.
		imagePaths: [
			"images/coin.png"
			"images/exhaust.png"
			"images/green-rocket.png"
			"images/red-cross.png"
			"images/red-rocket.png"
			"images/rocket.png"
			"images/skull.png"
			"images/star1.png"
			"images/star2.png"
			"images/tiny-world.png" ]

		# Will be called by Loader when the images have been loaded.
		initGame: ( images ) ->
			images[ "images/green-rocket.png" ].orientationOffset = Math.PI / 2
			images[ "images/red-rocket.png"   ].orientationOffset = Math.PI / 2
			images[ "images/exhaust.png"      ].orientationOffset = Math.PI / 2

			shapeData =
				"satellite":
					circle: Collisions.createCircle( 30 )
					offset: [ 0, 0 ]

			renderData =
				"image" : images
				"circle": shapeData

			display      = Rendering.createDisplay()
			currentInput = Input.createCurrentInput()
			gameState    = Logic.createGameState()
			renderState  = Graphics.createRenderState()

			Logic.initGameState( gameState )

			lastTimeInMs = Date.now()

			main = ( timeInMs ) ->
				passedTimeInMs = timeInMs - lastTimeInMs
				if passedTimeInMs > 1000 / 30
					passedTimeInMs = 1000 / 30

				timeInS       = timeInMs / 1000
				passedTimeInS = passedTimeInMs / 1000

				lastTimeInMs = timeInMs

				Logic.updateGameState(
					gameState,
					currentInput,
					timeInS,
					passedTimeInS,
					shapeData )
				Graphics.updateRenderState(
					renderState,
					gameState )
				Rendering.render(
					display,
					renderData,
					renderState.renderables )

				if gameState.reset
					gameState = Logic.createGameState()
					Logic.initGameState( gameState )

				requestAnimFrame( main )

			main( lastTimeInMs )
