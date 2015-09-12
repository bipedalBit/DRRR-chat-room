# DRRR-chat-room
I built the project on Ubuntu Kylin 14.04 with node.js. <br>
You need to install node.js and several modules to get the chat room built.<br>
## step 1: install node.js
[install node.js](https://nodejs.org/)<br>
Run "node -v" to confirm node.js has been installed successly.<br>
## step 2: install npm
[get npm](https://github.com/isaacs/npm)<br>
And if you have installed Git you can clone the project by:<br>
`git clone --recursive git://github.com/isaacs/npm.git`.<br>
Now you have necessary files. Install npm by running<br>
`node cli.js install npm -gf`<br>
at the root directory of npm files.
## step 3: install modules
You need 3 modules to install and you have npm.<br>
Run:<br>
`npm install express -gd`,<br>
`npm install socket.io -gd` and<br>
`npm install mysql -gd`<br>
to install express module, socket.io module and mysql module globally.<br>
Remove "-gd" in each command to install modules in current directory.<br>
## step 4: run the script
Run:<br>
`node ./index.js`<br>
at the root directory of DRRR-chat-room to start the chat room server.
## step 5: check it online
Visit `localhost:3000`.<br>
There is a default user in the database now with<br>
username: admin<br>
password: secret<br>
and registering new users need invite code from users signed in.