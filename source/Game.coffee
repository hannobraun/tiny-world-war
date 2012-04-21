# noop's Loader module expects a module named "Game" to exist. Loader will load
# all images specified in imagePaths and pass them to initGame.
define "Game", [ "Rendering", "Input", "Logic", "Graphics" ], ( Rendering, Input, Logic, Graphics )->
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
			"images/star.png" ]

		# Will be called by Loader when the images have been loaded.
		initGame: ( images ) ->
			renderData =
				"image": images

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
					passedTimeInS )
				Graphics.updateRenderState(
					renderState,
					gameState )
				Rendering.render(
					display,
					renderData,
					renderState.renderables )

				requestAnimFrame( main )

			main( lastTimeInMs )
