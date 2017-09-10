# What's changed since Master

A little inprogess project for myself to learn angular 2. When completed, it should allow you to list which git repos you're interested in (any you have locally) and display what commits have happened since the last merge to master.

This idea came about as a solution within my own company where higher ups didn't know what had been done since the app was last updated on the app store (which is when it was merged to master.)

Up to 4 repositories (currently) can be displayed and it will automatically resize the repos to fit the page.

![2 repos](https://user-images.githubusercontent.com/6452970/30248648-9b22b756-9623-11e7-88c1-5ba1166d1e25.png)

![3 repos](https://user-images.githubusercontent.com/6452970/30248647-9b1ea97c-9623-11e7-95cb-a477836b1a3b.png)

# How to use locally 

Node and Angular CLI are required.

To configure which repos you which to view, go to the config.js file in server and then change the `config.repos` field to contain an array of the paths to the 1-4 repos you wish to view.

You can then either run run.sh to start both in the background, or start two different terminal instances - one to cd into frontend and run `ng serve -o` and one to cd into server and run `node app.js`
