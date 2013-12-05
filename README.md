# ARDrone controlled by leapmotion

##How to install

- install node.js (see http://nodejs.org/)
- download project
- using command line, launch the server with `sudo node server.js` (enter password if asked)
- connect your computer to the drone's wifi

##How to use
- in your browser, go to `http://localhost:8080/` (I tested with Chrome, I suggest you try the same)
- You will then see the following interface:
![Interface](http://philippeauriach.me/projects/imgs/leapdrone/github-interface.png)
- When opening this interface, the drone should test its propellers.
- Connect your Leapmotion controller to the computer if it's not done. You should see the directions moving when you move your hand above it.
- No command will be send to the drone when it is in "safe mode" (understand : when your page is surrounded by a red border). To switch on and off from safe mode, press space. It will automatically go to safe mode if the hand leaves the leapmotion detection range.
- Press the `take off` button to make the drone take off, and the `land` one to make it land...
- When the drone is hovering after take off, put your hand in the horizontal position using the interface indicators, and press space to go live.
- Move your hand front/back, right/left, up/down to control the drone !

##Improvements

- The video is not yet supported
- Find a gesture to control take off and land, instead of buttons
- Find gesture for rotating the drone
- Implement "more you move, faster the drone goes". For now, the speed of the drone is constant, independently of your hand orientation
- In general, optimize and make the clode cleaner
