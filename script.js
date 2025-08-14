const cursor = document.querySelector('.cursor-trail')

document.addEventListener('mousemove', e => {
	cursor.style.opacity = '1'
	cursor.style.left = e.clientX - 4 + 'px'
	cursor.style.top = e.clientY - 4 + 'px'

	setTimeout(() => {
		cursor.style.opacity = '0'
		cursor.style.transition = 'opacity 0.5s'
	}, 100)
})

// Плавный скролл для якорей
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
	anchor.addEventListener('click', function (e) {
		e.preventDefault()
		document.querySelector(this.getAttribute('href')).scrollIntoView({
			behavior: 'smooth',
		})
	})
})

// Карусель соцсетей
const carousel = document.getElementById('socialCarousel')
const tiles = carousel.querySelectorAll('.social-tile')
const tileWidth = tiles[0].offsetWidth + 14
let currentIndex = 0

const API_URL = 'http://localhost:3000/api/activity'

async function updateWidget() {
	try {
		console.log('Запрашиваю данные...')
		const response = await fetch(API_URL)

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const data = await response.json()
		console.log('Получены данные:', data)

		// Обновляем активности
		const activitiesContainer = document.getElementById('activities')

		if (!data.activities || data.activities.length === 0) {
			activitiesContainer.innerHTML =
				'<p class="no-activity">Нет активностей</p>'
		} else {
			activitiesContainer.innerHTML = ''

			const filteredActivities = data.activities.filter(
				activity => activity.type !== 4
			)

			if (filteredActivities.length === 0) {
				activitiesContainer.innerHTML =
					'<p class="no-activity">Нет игр или музыки</p>'
				return
			}

			for (const activity of filteredActivities) {
				const activityElem = document.createElement('div')
				const isSpotify = activity.name === 'Spotify'
				const isGame = activity.type === 0 // 0 = Игра

				activityElem.className = `activity ${
					isSpotify ? 'spotify-activity' : 'game-activity'
				}`

				const iconUrl = await getActivityIconUrl(activity, isSpotify, isGame)

				let html = `
                    <img src="${iconUrl}" class="activity-icon" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
                    <div class="activity-content">
                        <div class="activity-name">${activity.name}</div>
                `

				if (activity.details) {
					html += `<div class="activity-details">${activity.details}</div>`
				}
				if (activity.state) {
					html += `<div class="activity-details">${activity.state}</div>`
				}

				html += `</div>`
				activityElem.innerHTML = html
				activitiesContainer.appendChild(activityElem)
			}
		}
	} catch (error) {
		console.error('Ошибка при загрузке данных:', error)
		document.getElementById('activities').innerHTML =
			'<p class="no-activity">Ошибка загрузки данных</p>'
	}
}

async function getActivityIconUrl(activity, isSpotify, isGame) {
	if (isSpotify && activity.assets?.largeImage) {
		return `https://i.scdn.co/image/${activity.assets.largeImage.replace(
			'spotify:',
			''
		)}`
	}

	if (isGame) {
		if (activity.assets?.largeImage) {
			if (await checkImageExists(activity.assets.largeImage)) {
				return activity.assets.largeImage
			}
		}
	}

	return 'https://cdn.discordapp.com/embed/avatars/0.png'
}

async function checkImageExists(url) {
	try {
		const response = await fetch(url, { method: 'HEAD' })
		return response.ok
	} catch {
		return false
	}
}

// Обновляем сразу и каждые 10 секунд
updateWidget()
setInterval(updateWidget, 10000)
