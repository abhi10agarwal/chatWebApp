const socket = io()

const $messageform = document.querySelector('#messageform')
const $messageforminput = document.querySelector('input')
const $messageformbutton = document.querySelector('button')
const $sendlocation = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

const messagetemplate = document.querySelector('#message-template').innerHTML
const locationtemplate = document.querySelector('#location-template').innerHTML
const sidebartemplate = document.querySelector('#sidebar-template').innerHTML
const { username, room } = Qs.parse(location.search, {
	ignoreQueryPrefix: true
})

const autoScroll = () => {
	//new message
	const $newMessage = $messages.lastElementChild

	const $newMessageStyle = getComputedStyle($newMessage)
	const $newMessageMargin = parseInt($newMessageStyle.marginBottom)
	const $newMessageHeight = $newMessage.offsetHeight + $newMessageMargin
	// visible height
	const visibleHeight = $messages.offsetHeight
	// height of container
	const contentHeight = $messages.scrollHeight
	const scrollOffset = $messages.scrollTop + visibleHeight

	if (contentHeight - $newMessageHeight <= scrollOffset) {
		$messages.scrollTop = $messages.scrollHeight
	}
}

socket.on('message', message => {
	const html = Mustache.render(messagetemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format('h:m a')
	})
	$messages.insertAdjacentHTML('beforeend', html)
	autoScroll()
})

socket.on('locationmessage', location => {
	const html = Mustache.render(locationtemplate, {
		username: location.username,
		location: location.url,
		createdAt: moment(location.createdAt).format('h:m a')
	})
	$messages.insertAdjacentHTML('beforeend', html)
	autoScroll()
})

socket.on('roomData', ({ room, users }) => {
	const html = Mustache.render(sidebartemplate, {
		room,
		users
	})
	document.querySelector('#sidebar').innerHTML = html
})

$messageform.addEventListener('submit', e => {
	e.preventDefault()
	$messageformbutton.setAttribute('disabled', 'disabled')
	const message = e.target.elements.message.value

	socket.emit('sendmessage', message, error => {
		$messageformbutton.removeAttribute('disabled')
		$messageforminput.value = ''
		$messageforminput.focus()
		if (error) {
			return console.log(error)
		}
		console.log('Message Delivered')
	})
})
$sendlocation.addEventListener('click', () => {
	if (!navigator.geolocation) {
		return alert('browser not supported this')
	}
	$sendlocation.setAttribute('disabled', 'disabled')
	navigator.geolocation.getCurrentPosition(position => {
		socket.emit(
			'sendlocation',
			{
				latitude: position.coords.latitude,
				longitude: position.coords.longitude
			},
			message => {
				$sendlocation.removeAttribute('disabled')
			}
		)
	})
})

socket.emit('join', { username, room }, error => {
	if (error) {
		alert(error)
		location.href = '/'
	}
})
