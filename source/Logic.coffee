define "Logic", [ "Input", "Entities", "Physics", "Vec2" ], ( Input, Entities, Physics, Vec2 ) ->
	nextDeathSatelliteId = 0

	entityFactories =
		"tinyPlanet": ( args ) ->
			entity =
				id: "tinyPlanet"
				components:
					"positions": [ 0, 0 ]
					"imageIds" : "images/tiny-world.png"

		"deathSatellite": ( args ) ->
			body = Physics.createBody()
			body.position = args.position
			body.velocity = args.velocity

			id = "deathSatellite#{ nextDeathSatelliteId }"
			nextDeathSatelliteId += 1

			entity =
				id: id
				components:
					"bodies"  : body
					"imageIds": "images/skull.png"

	G = 5e4
	applyGravity = ( bodies ) ->
		for entityId, body of bodies
			squaredDistance = Vec2.squaredLength( body.position )
			forceMagnitude = G * body.mass / squaredDistance

			force = Vec2.copy( body.position )
			Vec2.scale( force, -1 )
			Vec2.unit( force )
			Vec2.scale( force, forceMagnitude )
			body.forces.push( force )



	# There are functions for creating and destroying entities in the Entities
	# module. We will mostly use shortcuts however. They are declared here and
	# defined further down in initGameState.
	createEntity  = null
	destroyEntity = null

	module =
		createGameState: ->
			gameState =
				# Change this, if you want the camera to point somewhere else.
				focus: [ 0, 0 ]

				# Game entities are made up of components. Those are stored
				# separately.
				components:
					positions: {}
					bodies   : {}
					imageIds : {}

		initGameState: ( gameState ) ->
			# These are the shortcuts we will use for creating and destroying
			# entities.
			createEntity = ( type, args ) ->
				Entities.createEntity(
					entityFactories,
					gameState.components,
					type,
					args )
			destroyEntity = ( entityId ) ->
				Entities.destroyEntity(
					gameState.components,
					entityId )


			createEntity( "tinyPlanet", {} )

			createEntity( "deathSatellite", {
				position: [ 0, -100 ]
				velocity: [ 10, 0 ] } )

		updateGameState: ( gameState, currentInput, timeInS, passedTimeInS ) ->
			applyGravity( gameState.components.bodies )
			Physics.update(
				gameState.components.bodies,
				passedTimeInS )
