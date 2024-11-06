# Genial Feed
Genial Feed is an Index and Website designed to improve people's ability to read longer stuff. The end goal is an app that offers prizes to people for reading more and more long form content (outside of mandatory activities) and then passing AI generated tests on that content.

Currently, it features a Server based (hoping to eventually become serverless) backend, which is able to contain users and RSS feeds which the user subscribes to, and then fetch those feeds.
It also uses Google Firebase for the DB, both for feed storage, folder storage, and for authentication purposes.

TODO Frontend:

	- Get invalid modal and feed adding modal working in Index
	- Add feed list display in Index
	- Add add folder and feed in Index
 	- Add settings page in Index
	- Add drag and drop for folders in Index
	- Add reading feeds and folders in Index
	- Make folders fold down in Index
	- Add Login with google to Index
	- Style Index
	- Add website loading icon for feed adding when feeds are already being read
	- Make website feed url modal cleared after stuff is inputted

TODO Backend:

 	- Add AI generated feeds from websites
	- Make docker and serverless and run from Google
	- Make AI generated exams



## Demo of the browser version
[![Web demo](https://cloud-nxhxe0zhe-hack-club-bot.vercel.app/0screenshot_2024-08-25_224350.png)](https://www.youtube.com/watch?v=ML2GIfpMsqs)

## Demo of the mobile version
[Mobile demo](https://www.youtube.com/shorts/ag2VDNotW9k)

### To run:
You gotta go to the backend, and then go `uvicorn api:app --host 0.0.0.0 --reload`. Then for the website you run it through JetBrains webstorm (at least that's how I've been doing it)
For the Index you also need to install Expo and React Native/npx and run `npx expo start --tunnel` (The --tunnel is not necessary, but it helps for some reason)
