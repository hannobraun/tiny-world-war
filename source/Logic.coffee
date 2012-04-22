define "Logic", [ "Input", "Entities", "ModifiedPhysics", "Vec2", "Transform2d", "Collisions" ], ( Input, Entities, Physics, Vec2, Transform2d, Collisions ) ->
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

			satellite =
				player   : args.player
				health   : 100
				maxHealth: 100

			id = "deathSatellite#{ nextDeathSatelliteId }"
			nextDeathSatelliteId += 1

			entity =
				id: id
				components:
					"bodies"         : body
					"imageIds"       : "images/skull.png"
					"satellites"     : satellite
					"shapes"         : "satellite"
					"deathSatellites": {}

		"repairSatellite": ( args ) ->
			body = Physics.createBody()
			body.position = args.position
			body.velocity = args.velocity

			satellite =
				player   : args.player
				health   : 100
				maxHealth: 100

			id = "repairSatellite#{ nextRepairSatelliteId }"
			nextRepairSatelliteId += 1

			entity =
				id: id
				components:
					"bodies"          : body
					"imageIds"        : "images/red-cross.png"
					"satellites"      : satellite
					"repairSatellites": {}
					"shapes"          : "satellite"

		"scoreSatellite": ( args ) ->
			body = Physics.createBody()
			body.position = args.position
			body.velocity = args.velocity

			satellite =
				player   : args.player
				health   : 100
				maxHealth: 100

			id = "scoreSatellite#{ nextScoreSatelliteId }"
			nextScoreSatelliteId += 1

			entity =
				id: id
				components:
					"bodies"         : body
					"imageIds"       : "images/coin.png"
					"satellites"     : satellite
					"shapes"         : "satellite"
					"scoreSatellites": {}

		"rocket": ( args ) ->
			body = Physics.createBody()
			body.position    = args.position
			body.velocity    = args.velocity
			body.orientation = -Math.PI / 2

			rocket =
				accelerates: false
				payload    : args.payload
				player     : "#{ args.player }Player"

			id = "#{ args.player }Rocket"

			entity =
				id: id
				components:
					"bodies"  : body
					"rockets" : rocket
					"imageIds": "images/#{ args.player }-rocket.png"

		"player": ( args ) ->
			player =
				color: args.color

				selectedIndex  : 0
				selectedPayload: "deathSatellite"
				justSelected   : false

				progress   : 0
				maxProgress: 100

				fuel   : 0
				maxFuel: 100
				minFuel: 20

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
			"left"  : "left arrow"
			"right" : "right arrow"
		"greenPlayer":
			"launch": "q"
			"left"  : "a"
			"right" : "d"

	angularVelocity = 2
	accelerationForce = 5

	payloadSelection = [ "deathSatellite", "repairSatellite", "scoreSatellite" ]

	applyInput = ( currentInput, bodies, rockets, players, createEntity, destroyEntity ) ->
		for entityId, rocket of rockets
			body    = bodies[ entityId ]
			player  = players[ rocket.player ]
			mapping = inputMappings[ entityId ]

			body.angularVelocity = 0
			if Input.isKeyDown( currentInput, mapping[ "left" ] )
				body.angularVelocity = -angularVelocity
			if Input.isKeyDown( currentInput, mapping[ "right" ] )
				body.angularVelocity = angularVelocity

			rocket.accelerates = false
			if Input.isKeyDown( currentInput, mapping[ "up" ] ) && player.fuel > 0
				force = [ accelerationForce, 0 ]
				rotationTransform = Transform2d.rotationMatrix( body.orientation )
				Vec2.applyTransform( force, rotationTransform )
				body.forces.push( force )

				rocket.accelerates = true

			if Input.isKeyDown( currentInput, mapping[ "down" ] )
				createEntity( rocket.payload, {
					position: body.position,
					velocity: body.velocity,
					player  : rocket.player } )
				destroyEntity( entityId )
				player.fuel = 0

		for entityId, player of players
			rocketId = "#{ player.color }Rocket"
			mapping  = inputMappings[ entityId ]

			unless rockets[ rocketId ]?
				if Input.isKeyDown( currentInput, mapping[ "launch" ] ) && player.fuel >= player.minFuel
					createEntity( "rocket", {
						position: [ 0, -50 ]
						velocity: [ 30, 0 ]
						player  : player.color,
						payload : player.selectedPayload } )

				if player.justSelected
					unless Input.isKeyDown( currentInput, mapping[ "right" ] ) || Input.isKeyDown( currentInput, mapping[ "left" ] )
						player.justSelected = false
				else if Input.isKeyDown( currentInput, mapping[ "right" ] ) || Input.isKeyDown( currentInput, mapping[ "left" ] )
					if Input.isKeyDown( currentInput, mapping[ "right" ] )
						player.selectedIndex += 1
					if Input.isKeyDown( currentInput, mapping[ "left" ] )
						player.selectedIndex -= 1

					player.selectedIndex = ( player.selectedIndex + payloadSelection.length ) % payloadSelection.length
					player.selectedPayload = payloadSelection[ player.selectedIndex ]
					player.justSelected = true



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

	fuelBurn = 50
	fuelGain = 5
	manageFuel = ( players, rockets, passedTimeInS ) ->
		for entityId, player of players
			rocketId = "#{ player.color }Rocket"
			rocket   = rockets[ rocketId ]

			if rocket?
				if rocket.accelerates
					player.fuel -= fuelBurn * passedTimeInS

				if player.fuel < 0
					player.fuel = 0
			else
				player.fuel += fuelGain * passedTimeInS
				if player.fuel > player.maxFuel
					player.fuel = player.maxFuel

	progressGain = 0.5
	addProgress = ( scoreSatellites, satellites, players, passedTimeInS ) ->
		for entityId, scoreSatellite of scoreSatellites
			satellite = satellites[ entityId ]
			player    = players[ satellite.player ]

			player.progress += progressGain * passedTimeInS
			if player.progress > player.maxProgress
				player.progress = player.maxProgress


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

	detectCollisions = ( bodies, shapes, shapeData ) ->
		collisions = []

		pairs = Collisions.buildPairs( shapes )

		for pair in pairs
			shape1 = shapeData[ shapes[ pair[ 0 ] ] ]
			shape2 = shapeData[ shapes[ pair[ 1 ] ] ]

			pos1 = Vec2.copy( bodies[ pair[ 0 ] ].position )
			pos2 = Vec2.copy( bodies[ pair[ 1 ] ].position )
			Vec2.add( pos1, shape1.offset )
			Vec2.add( pos2, shape2.offset )

			contact = Collisions.checkCollision(
				pos1,
				pos2,
				shape1.circle,
				shape2.circle )

			collision =
				entityA: pair[ 0 ]
				entityB: pair[ 1 ]
				contact: contact

			if contact.touches
				collisions.push( collision )

		collisions

	amountOfDeath  = 10
	amountOfRepair = 5
	handleCollisions = ( collisions, satellites, deathSatellites, repairSatellites, bodies, passedTimeInS ) ->
		for entityId, satellite of satellites
			satellite.isActive = false

		entitiesToDestroy = []

		for collision in collisions
			satelliteA = satellites[ collision.entityA ]
			satelliteB = satellites[ collision.entityB ]
			bodyA = bodies[ collision.entityA ]
			bodyB = bodies[ collision.entityB ]

			if satelliteA.player == satelliteB.player
				if repairSatellites[ collision.entityA ]?
					satelliteA.isActive = true
					satelliteA.target = bodyB.position
					satelliteB.health += amountOfRepair * passedTimeInS
					if satelliteB.health > satelliteB.maxHealth
						satelliteB.health = satelliteB.maxHealth
				if repairSatellites[ collision.entityB ]?
					satelliteB.isActive = true
					satelliteB.target = bodyA.position
					satelliteA.health += amountOfRepair * passedTimeInS
					if satelliteA.health > satelliteA.maxHealth
						satelliteA.health = satelliteA.maxHealth
			else
				if deathSatellites[ collision.entityA ]?
					satelliteA.isActive = true
					satelliteA.target = bodyB.position
					satelliteB.health -= amountOfDeath * passedTimeInS
					if satelliteB.health <= 0
						entitiesToDestroy.push( collision.entityB )
				if deathSatellites[ collision.entityB ]?
					satellite.isActive = true
					satelliteB.target = bodyA.position
					satelliteA.health -= amountOfDeath * passedTimeInS
					if satelliteA.health <= 0
						entitiesToDestroy.push( collision.entityA )

		for entityId in entitiesToDestroy
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
					positions       : {}
					bodies          : {}
					imageIds        : {}
					rockets         : {}
					players         : {}
					satellites      : {}
					shapes          : {}
					deathSatellites : {}
					scoreSatellites : {}
					repairSatellites: {}

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

		updateGameState: ( gameState, currentInput, timeInS, passedTimeInS, shapeData ) ->
			applyInput(
				currentInput,
				gameState.components.bodies,
				gameState.components.rockets,
				gameState.components.players,
				createEntity,
				destroyEntity )
			manageFuel(
				gameState.components.players,
				gameState.components.rockets,
				passedTimeInS )
			applyGravity(
				gameState.components.bodies )
			Physics.update(
				gameState.components.bodies,
				passedTimeInS )
			checkPlanetCollision(
				gameState.components.bodies,
				destroyEntity )
			addProgress(
				gameState.components.scoreSatellites,
				gameState.components.satellites,
				gameState.components.players,
				passedTimeInS )
			collisions = detectCollisions(
				gameState.components.bodies,
				gameState.components.shapes,
				shapeData )
			handleCollisions(
				collisions,
				gameState.components.satellites,
				gameState.components.deathSatellites,
				gameState.components.repairSatellites,
				gameState.components.bodies,
				passedTimeInS )
