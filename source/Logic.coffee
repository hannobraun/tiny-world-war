define "Logic", [ "Input", "Entities", "Physics", "Vec2" ], ( Input, Entities, Physics, Vec2 ) ->
	nextDeathSatelliteId  = 0
	nextRepairSatelliteId = 0
	nextRocketId          = 0
	nextScoreSatelliteId  = 0

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

		"repairSatellite": ( args ) ->
			body = Physics.createBody()
			body.position = args.position
			body.velocity = args.velocity

			id = "repairSatellite#{ nextRepairSatelliteId }"
			nextRepairSatelliteId += 1

			entity =
				id: id
				components:
					"bodies"  : body
					"imageIds": "images/red-cross.png"

		"scoreSatellite": ( args ) ->
			body = Physics.createBody()
			body.position = args.position
			body.velocity = args.velocity

			id = "scoreSatellite#{ nextScoreSatelliteId }"
			nextScoreSatelliteId += 1

			entity =
				id: id
				components:
					"bodies"  : body
					"imageIds": "images/coin.png"

		"rocket": ( args ) ->
			body = Physics.createBody()
			body.position    = args.position
			body.velocity    = args.velocity
			body.orientation = -Math.PI / 2

			id = "rocket#{ nextRocketId }"
			nextRocketId += 1

			entity =
				id: id
				components:
					"bodies": body
					"imageIds": "images/rocket.png"

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

			createEntity( "repairSatellite", {
				position: [ 0, -150 ]
				velocity: [ 15, 0 ] } )

			createEntity( "scoreSatellite", {
				position: [ 0, -50 ]
				velocity: [ 20, 0 ] } )

			createEntity( "rocket", {
				position: [ 0, -20 ]
				velocity: [ 30, 0 ] } )

		updateGameState: ( gameState, currentInput, timeInS, passedTimeInS ) ->
			applyGravity( gameState.components.bodies )
			Physics.update(
				gameState.components.bodies,
				passedTimeInS )
