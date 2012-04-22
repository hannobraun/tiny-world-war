define "Logic", [ "Input", "Entities", "ModifiedPhysics", "Vec2", "Transform2d" ], ( Input, Entities, Physics, Vec2, Transform2d ) ->
	nextDeathSatelliteId  = 0
	nextRepairSatelliteId = 0
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

			rocket =
				accelerates: false
				payload    : "deathSatellite"

			id = "#{ args.player }Rocket"

			entity =
				id: id
				components:
					"bodies"  : body
					"rockets" : rocket
					"imageIds": "images/#{ args.player }-rocket.png"

		"player": ( args ) ->
			player =
				color          : args.color
				selectedPayload: "deathSatellite"

			entity =
				id: "#{ args.color }Player"
				components:
					players: player

	inputMappings =
		"redRocket":
			"left" : "left arrow"
			"right": "right arrow"
			"up"   : "up arrow"
			"down" : "down arrow"
		"greenRocket":
			"left" : "a"
			"right": "d"
			"up"   : "w"
			"down" : "s"
		"redPlayer":
			"launch": "ctrl"
		"greenPlayer":
			"launch": "q"
	angularVelocity = 2
	accelerationForce = 5
	applyInput = ( currentInput, bodies, rockets, players, createEntity, destroyEntity ) ->
		for entityId, rocket of rockets
			body    = bodies[ entityId ]
			mapping = inputMappings[ entityId ]

			body.angularVelocity = 0
			if Input.isKeyDown( currentInput, mapping[ "left" ] )
				body.angularVelocity = -angularVelocity
			if Input.isKeyDown( currentInput, mapping[ "right" ] )
				body.angularVelocity = angularVelocity

			rocket.accelerates = false
			if Input.isKeyDown( currentInput, mapping[ "up" ] )
				force = [ accelerationForce, 0 ]
				rotationTransform = Transform2d.rotationMatrix( body.orientation )
				Vec2.applyTransform( force, rotationTransform )
				body.forces.push( force )

				rocket.accelerates = true

			if Input.isKeyDown( currentInput, mapping[ "down" ] )
				createEntity( rocket.payload, {
					position: body.position,
					velocity: body.velocity } )
				destroyEntity( entityId )

		for entityId, player of players
			mapping = inputMappings[ entityId ]

			if Input.isKeyDown( currentInput, mapping[ "launch" ] )
				unless bodies[ "#{ player.color }Rocket" ]?
					createEntity( "rocket", {
						position: [ 0, -50 ]
						velocity: [ 30, 0 ]
						player  : player.color } )

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

	planetSize     = 32
	halfPlanetSize = planetSize / 2
	checkPlanetCollision = ( bodies, destroyEntity ) ->
		for entityId, body of bodies
			if (
				body.position[ 0 ] < halfPlanetSize &&
				body.position[ 0 ] > -halfPlanetSize &&
				body.position[ 1 ] < halfPlanetSize &&
				body.position[ 1 ] > -halfPlanetSize )

				destroyEntity( entityId )

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
					rockets  : {}
					players  : {}

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

			createEntity( "player", {
				color: "red" } )
			createEntity( "player", {
				color: "green" } )

			# createEntity( "deathSatellite", {
			# 	position: [ 0, -100 ]
			# 	velocity: [ 20, 0 ] } )

			# createEntity( "repairSatellite", {
			# 	position: [ 0, -150 ]
			# 	velocity: [ 15, 0 ] } )

			# createEntity( "scoreSatellite", {
			# 	position: [ 0, -200 ]
			# 	velocity: [ 15, 0 ] } )

			# createEntity( "rocket", {
			# 	position: [ 0, -50 ]
			# 	velocity: [ 30, 0 ]
			# 	player  : "red" } )
			# createEntity( "rocket", {
			# 	position: [ 0, 50 ]
			# 	velocity: [ -30, 0 ]
			# 	player  : "green" } )

		updateGameState: ( gameState, currentInput, timeInS, passedTimeInS ) ->
			applyInput(
				currentInput,
				gameState.components.bodies,
				gameState.components.rockets,
				gameState.components.players,
				createEntity,
				destroyEntity )
			applyGravity(
				gameState.components.bodies )
			Physics.update(
				gameState.components.bodies,
				passedTimeInS )
			checkPlanetCollision(
				gameState.components.bodies,
				destroyEntity )
