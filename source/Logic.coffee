define "Logic", [ "Input", "Entities", "ModifiedPhysics", "Vec2", "Transform2d" ], ( Input, Entities, Physics, Vec2, Transform2d ) ->
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

			id = "#{ args.player }Rocket"
			nextRocketId += 1

			entity =
				id: id
				components:
					"bodies": body
					"imageIds": "images/#{ args.player }-rocket.png"

	inputMappings =
		"redRocket":
			"left" : "left arrow"
			"right": "right arrow"
			"up"   : "up arrow"
		"greenRocket":
			"left" : "a"
			"right": "d"
			"up"   : "w"
	angularVelocity = 2
	accelerationForce = 5
	applyInput = ( currentInput, bodies ) ->
		for rocketId, mapping of inputMappings
			rocket = bodies[ rocketId ]

			if rocket?
				rocket.angularVelocity = 0
				if Input.isKeyDown( currentInput, mapping[ "left" ] )
					rocket.angularVelocity = -angularVelocity
				if Input.isKeyDown( currentInput, mapping[ "right" ] )
					rocket.angularVelocity = angularVelocity

				if Input.isKeyDown( currentInput, mapping[ "up" ] )
					force = [ accelerationForce, 0 ]
					rotationTransform = Transform2d.rotationMatrix( rocket.orientation )
					Vec2.applyTransform( force, rotationTransform )
					rocket.forces.push( force )


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
				velocity: [ 20, 0 ] } )

			createEntity( "repairSatellite", {
				position: [ 0, -150 ]
				velocity: [ 15, 0 ] } )

			createEntity( "scoreSatellite", {
				position: [ 0, -200 ]
				velocity: [ 15, 0 ] } )

			createEntity( "rocket", {
				position: [ 0, -50 ]
				velocity: [ 30, 0 ]
				player  : "red" } )
			createEntity( "rocket", {
				position: [ 0, 50 ]
				velocity: [ -30, 0 ]
				player  : "green" } )

		updateGameState: ( gameState, currentInput, timeInS, passedTimeInS ) ->
			applyInput(
				currentInput,
				gameState.components.bodies )
			applyGravity(
				gameState.components.bodies )
			Physics.update(
				gameState.components.bodies,
				passedTimeInS )
