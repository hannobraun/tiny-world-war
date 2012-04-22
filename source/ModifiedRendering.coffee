define "ModifiedRendering", [], ->
	drawFunctions =
		"image": ( images, context, renderable ) ->
			image = images[ renderable.resourceId ]
			unless image?
				throw "Image #{ renderable.resourceId } does not exist."

			context.translate(
				renderable.position[ 0 ],
				renderable.position[ 1 ] )
			context.rotate( renderable.orientation + image.orientationOffset )
			context.translate(
				image.positionOffset[ 0 ],
				image.positionOffset[ 1 ] )
			context.drawImage( image.rawImage, 0, 0 )

		"circle": ( shapes, context, renderable ) ->
			shape = shapes[ renderable.resourceId ]

			context.translate(
				renderable.position[ 0 ],
				renderable.position[ 1 ] )
			context.rotate( renderable.orientation )
			context.translate(
				shape.offset[ 0 ],
				shape.offset[ 1 ] )
			context.beginPath()
			context.arc(
				0,
				0,
				shape.circle.radius,
				0,
				Math.PI * 2,
				true )
			context.stroke()

		"ellipse":( _, context, renderable ) ->
			ellipse = renderable.ellipse

			context.strokeStyle = ellipse.color

			context.translate(
				renderable.position[ 0 ],
				renderable.position[ 1 ] )
			context.rotate(
				renderable.orientation )
			context.scale(
				ellipse.semiMajorAxis / ellipse.semiMinorAxis,
				1 )
			context.beginPath()
			context.arc(
				0,
				0,
				ellipse.semiMinorAxis,
				0,
				2*Math.PI,
				false )
			context.stroke()
			context.closePath()

		"rectangle": ( _, context, renderable ) ->
			context.fillStyle = renderable.color || "rgb(255,255,255)"
			context.fillRect(
				renderable.position[ 0 ],
				renderable.position[ 1 ],
				renderable.size[ 0 ],
				renderable.size[ 1 ] )

		"hollowRectangle": ( _, context, renderable ) ->
			context.strokeStyle = renderable.color || "rgb(0,0,0)"
			context.strokeRect(
				renderable.position[ 0 ],
				renderable.position[ 1 ],
				renderable.size[ 0 ],
				renderable.size[ 1 ] )

		"text": ( _, context, renderable ) ->
			context.fillStyle = renderable.color || "rgb(0,0,0)"
			context.fillText(
				renderable.text,
				renderable.position[ 0 ],
				renderable.position[ 1 ] )

	module =
		createDisplay: ->
			canvas  = document.getElementById( "canvas" )
			context = canvas.getContext( "2d" )

			# Setting up the coordinate system for the context. The goal here:
			# - (0,0) should be at the center of the canvas.
			# - Positive x should be to the right, positive y downwards.
			# - Each unit should be exactly one pixel.
			context.translate(
			 	canvas.width  / 2,
			 	canvas.height / 2 )
			
			display =
				context: context,
				size   : [ canvas.width, canvas.height ]

		createRenderable: ( type, resourceId ) ->
			renderable =
				type       : type
				resourceId : resourceId
				position   : [ 0, 0 ]
				orientation: 0

		createCamera: ->
			camera =
				position: [ 0, 0 ]

		render: ( display, renderData, renderables ) ->
			context = display.context

			width  = display.size[ 0 ]
			height = display.size[ 1 ]
			
			context.clearRect(
				-width  / 2,
				-height / 2,
				width,
				height )

			for renderable in renderables
				context.save()

				type = renderable.type
				drawRenderable = drawFunctions[ type ]
				drawRenderable( renderData[ type ], context, renderable )

				context.restore()
