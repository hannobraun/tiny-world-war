define "ModifiedPhysics", [ "Vec2" ], ( Vec2 ) ->
	module =
		parameters:
			collisionResponse:
				k: 10000
				b: 0

		createBody: ->
			body =
				position    : [ 0, 0 ]
				velocity    : [ 0, 0 ]
				acceleration: [ 0, 0 ]

				orientation    : 0
				angularVelocity: 0

				forces: []
				mass  : 1

		integrate: ( bodies, passedTimeInS ) ->
			for entityId, body of bodies
				newAcceleration = [ 0, 0 ]
				for force in body.forces
					Vec2.scale( force, 1 / body.mass )
					Vec2.add( newAcceleration, force )
				body.forces.length = 0

				body.acceleration = newAcceleration

				velocityChange = Vec2.copy( body.acceleration )
				Vec2.scale( velocityChange, passedTimeInS )
				Vec2.add( body.velocity, velocityChange )

				positionChange = Vec2.copy( body.velocity )
				Vec2.scale( positionChange, passedTimeInS )
				Vec2.add( body.position, positionChange )


				# newAcceleration = [ 0, 0 ]
				# for force in body.forces
				# 	Vec2.scale( force, 1 / body.mass )
				# 	Vec2.add( newAcceleration, force )
				# body.forces.length = 0


				# movementFromVelocity = Vec2.copy( body.velocity )
				# Vec2.scale( movementFromVelocity, passedTimeInS )

				# movementFromAcceleration = Vec2.copy( body.acceleration )
				# Vec2.scale( movementFromAcceleration, 0.5 )
				# Vec2.scale(
				# 	movementFromAcceleration,
				# 	passedTimeInS*passedTimeInS )

				# Vec2.add( body.position, movementFromVelocity )
				# Vec2.add( body.position, movementFromAcceleration )


				# velocityChange = Vec2.copy( body.acceleration )
				# Vec2.add( velocityChange, newAcceleration )
				# Vec2.scale( velocityChange, 0.5 )
				# Vec2.scale( velocityChange, passedTimeInS )
				# Vec2.add( body.velocity, velocityChange )


				# body.acceleration = newAcceleration

		integrateOrientation: ( bodies, passedTimeInS ) ->
			for entityId, body of bodies
				body.orientation += body.angularVelocity * passedTimeInS

		applyForces: ( bodies ) ->
			for entityId, body of bodies
				body.acceleration = [ 0, 0 ]

				for force in body.forces
					Vec2.scale( force, 1 / body.mass )
					Vec2.add( body.acceleration, force )

				body.forces.length = 0

		update: ( bodies, passedTimeInS ) ->
			module.integrate( bodies, passedTimeInS )
			module.integrateOrientation( bodies, passedTimeInS )
			module.applyForces( bodies )

		handleContacts: ( contacts, bodies, parameters ) ->
			k = parameters.k # spring constant
			b = parameters.b # damping constant

			for contact in contacts
				bodyA = bodies[ contact.bodies[ 0 ] ]
				bodyB = bodies[ contact.bodies[ 1 ] ]

				relativeVelocity = Vec2.copy( bodyA.velocity )
				Vec2.subtract( relativeVelocity, bodyB.velocity )

				spring = Vec2.copy( contact.normal )
				Vec2.scale(
					spring,
					-k * contact.depth )

				damping = Vec2.copy( contact.normal )
				Vec2.scale(
					damping,
					b * Vec2.dot( contact.normal, relativeVelocity ) )

				force = Vec2.copy( spring )
				Vec2.add( force, damping )
				Vec2.scale( force, 0.5 )

				negativeForce = Vec2.copy( force )
				Vec2.scale( negativeForce, -1 )

				bodyA.forces.push( force )
				bodyB.forces.push( negativeForce )
