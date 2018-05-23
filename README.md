# MLB Coding Exercise

This project was created as a coding assessment for a company. It is a simple project that demonstrates calling an API to load a list of baseball games that can then be navigated using arrow keys.

## Live Site

The live version of this project (tied to the gh_pages branch) is at https://kevinleetham.github.io/mlb_coding_exercise/

## API Details

The API provided does not currently support CORS headers, so Javascript code cannot call it. JSONP is not supported either. So this solution includes the use of a custom Azure Function App. The Javascript calls this app, which does support CORS and HTTPS, and that app in turn calls the original API. See azure/run.csx for the code in that function.

## Coding Decisions
### Limitations
* The MLB API appears to have been deprecated starting in 2017. The copyright notice for calls that year and later says "NOTICE: This file is no longer actively supported." It does return some data, but the image links are broken. So this was coded to default to the current date but in 2016.
* The instructions say to scale the selected image up 125%. It does become a bit pixelated when doing so, but this could only be avoided by making the non-selected images smaller, which did not give a very good experience.
* Some games do not have the "scenario 7" video thumbnail. I created a generic no-thumbnail.png that is used in this case.
* Because of time constraints, this code does not include a build pipeline. So it does not have a CSS Precompiler (the CSS would have been a lot cleaner with one), minification, or unit testing.
* Even though the scoreboard may be part of an overall app, I assumed the user would want the keystrokes to work from anywhere on the page. So the keydown event handler is tied to the body. 

### Architecture notes
* This was coded using the jQuery library to facilitate accessing the DOM. It could have been done with vanilla JS but the use of the 35k minified code seemed worth the time savings.
* Since this was to be treated as potentially a feature in a larger app, the scoreboard was coded as a jQuery plugin. So the background, header, and a scoreboard placeholder appear on the index.html, but the template and code for the scoreboard appear in scoreboard.js and scoreboard.css. This has the drawback of having HTML code in a JS file. Other frameworks like Angular or React would be a cleaner approach.

