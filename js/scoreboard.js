/* Scoreboard plugin -- turns a div into a scoreboard that shows the scores for a day */
(function($){
    $.fn.scoreboard = function(){

        //--------------------------------
        // Variables
        //--------------------------------
        //Template for scoreboard layout
        const scoreboardEl = this.append(`<div class='scoreboard-plugin'>
                                            <div class='overlay'>
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th></th>
                                                            <th class='border'>R</th>
                                                            <th class='border'>H</th>
                                                            <th class='border'>E</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr class='away'>
                                                            <td class='team-name-col'>
                                                                <p class='team-name'>Braves</p>
                                                                <p class='team-stats'></p>
                                                            </td>
                                                            <td class='team-runs'>2</td>
                                                            <td class='team-hits'>2</td>
                                                            <td class='team-errors'>2</td>
                                                        </tr>
                                                        <tr class='home'>
                                                            <td class='team-name-col'>
                                                                <p class='team-name'>Braves</p>
                                                                <p class='team-stats'>(18-26)</p>
                                                            </td>
                                                            <td class='team-runs'>2</td>
                                                            <td class='team-hits'>2</td>
                                                            <td class='team-errors'>2</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <div class='instructions'>Press enter to close</div>
                                            </div>
                                            <div class='date-selector'>
                                                <div class='date'></div>
                                                <div class='instructions'>Press the up or down key to change date</div>
                                            </div>
                                            <div class='loading'>Loading games...</div>
                                            <div class='no-games'>No games found for this date</div>
                                            <div class='content'>
                                                <div class='selected-header'></div>
                                                <div class='tile-wrapper no-transition'></div>
                                                <div class='selected-footer'></div>
                                            </div>
                                            <div class='overall-instructions'>Use left and right so select a game. Press enter to view the score.</div>
                                          </div>`);

        //Initial date settings to be today's date
        //(but in 2016 because API is deprecated starting in 2017)
        let month = new Date().getMonth() + 1;
        let day = new Date().getDate();
        let year = 2016;

        //Overall control variables
        let games = [];
        let selectedIndex = 0;
        let overlayVisible = false;
        
        //--------------------------------
        // Startup Code
        //--------------------------------
        setupEventHandlers();
        loadGamesForDate(month, day, year);


        //--------------------------------
        // Private functions
        //--------------------------------
        //Set up the key and resize handlers
        function setupEventHandlers(){
            //Key handler
            $('body').keydown((e) => {
                if (e.keyCode === 13) { //enter
                    showOverlay(!overlayVisible);
                } else if (!overlayVisible) {
                    if (e.keyCode === 37) { //left arrow
                        selectGame(selectedIndex - 1);
                    } else if (e.keyCode === 39) { //right arrow
                        selectGame(selectedIndex + 1);
                    } else if (e.keyCode === 38) { //up arrow
                        loadGamesForDate(month, day + 1, year);
                    } else if (e.keyCode === 40) { //down arrow
                        loadGamesForDate(month, day - 1, year);
                    }
                }
            });

            //Resize handler (force a recentering)
            $(window).resize(() => {
                selectGame(selectedIndex);
            });
        }
        
        //Call the API for a given date and load all the tiles
        function loadGamesForDate(newMonth, newDay, newYear){

            //Put UI into "loading" mode
            showLoading(true);

            //Construct a date so we can get wrap to previous and next, then display it
            var date = new Date(newYear, newMonth - 1, newDay);
            month = date.getMonth() + 1;
            day = date.getDate();
            year = date.getFullYear();
            scoreboardEl.find('.date').text(`${month}/${day}/${year}`);

            //Retrieve
            $.getJSON(`https://leethambamtech.azurewebsites.net/api/master_scoreboard?month=${month.toString().padStart(2,"0")}&day=${day.toString().padStart(2,"0")}&year=${year}`)
                .done((response) => {
                    let tiles = [];

                    games = response.data && response.data.games && response.data.games.game;
   
                    if (games && games.length){
                        //Build each tile in memory
                        games.forEach((el) => {
                            let thumbURL = 'images/no-thumb.png';
                            if (el.video_thumbnails != null){
                                let thumb = el.video_thumbnails.thumbnail.find((thumb) => thumb.scenario === "7");
                                if (thumb && thumb.content) {
                                    thumbURL = thumb.content;
                                }
                            }
                            tiles.push(`<div class="tile" style="background:url('${thumbURL}')"></tile>`);
                        });
                        
                        //Append all the tiles to the UI
                        scoreboardEl.find(".tile-wrapper").empty();
                        scoreboardEl.find(".tile-wrapper").append(tiles);
                        
                        //Select the first one and show it
                        selectGame(0);
                        showLoading(false);
                    } else {
                        //There was an error -- just show that there are no games
                        showNoGames();
                    }

                })
                .fail(() => {
                    //There was an error -- just show that there are no games
                    games = [];
                    showNoGames();
                });
        }
        
        //Show or hide the loading indicator (hide or show the content accordingly)
        function showLoading(visible){
            if (visible){
                scoreboardEl.find('.loading').show();
                scoreboardEl.find('.content').hide();
                scoreboardEl.find('.tile-wrapper').hide(); //Technically this is already hidden, but this hide avoids flickers with the transition
                scoreboardEl.find('.no-games').hide();
            } else {
                scoreboardEl.find('.loading').hide();
                scoreboardEl.find('.content').show();
                scoreboardEl.find('.tile-wrapper').show();
            }
        }

        //Show the screen saying there are no games
        function showNoGames(){
            scoreboardEl.find('.no-games').show();
            showLoading(false);
        }

        //Set the highlight to a specific game
        function selectGame(index){
            //Block scrolling off list
            if (index < 0 || index >= games.length) {
                return;
            }

            //Compute how to position the wrapper so the selected tile is in the horizontal center of the screen 
            const tileWidth = 144; //This is the CSS width + margins
            const selectionOffset = 7; //Extra adjustment needed on just the width of the selected tile because it is scaled
            const wrapperWidth = scoreboardEl.width();
            const newPos = ((wrapperWidth - tileWidth) / 2) - (index * tileWidth) - selectionOffset;
            scoreboardEl.find('.tile-wrapper').css({'transform': `translateX(${newPos}px)`});

            //Give the selected class to the right tile
            scoreboardEl.find('.tile').removeClass('selected');
            scoreboardEl.find(`.tile:nth-child(${index + 1})`).addClass('selected');

            //Display the header and footer
            let game = games[index];
            scoreboardEl.find('.selected-header').text(`${game.away_team_name} at ${game.home_team_name}`);
            scoreboardEl.find('.selected-footer').text(`${game.home_time} ${game.home_ampm} (${game.home_time_zone})\n ${game.venue}`);

            //Remember which tile is selected
            selectedIndex = index;
        }

        //Show/hide the overlay with the game stats
        function showOverlay(visible){
            overlayVisible = visible;
            let game = games[selectedIndex];
            let overlayEl = scoreboardEl.find('.overlay');
            if (visible){
                overlayEl.find('.away').toggleClass('winner', game.linescore.r.away > game.linescore.r.home);
                overlayEl.find('.away .team-name').text(game.away_team_name);
                overlayEl.find('.away .team-stats').text(`(${game.away_win}-${game.away_loss})`);
                overlayEl.find('.away .team-runs').text(game.linescore.r.away);
                overlayEl.find('.away .team-hits').text(game.linescore.h.away);
                overlayEl.find('.away .team-errors').text(game.linescore.e.away);

                overlayEl.find('.home').toggleClass('winner', game.linescore.r.home > game.linescore.r.away);
                overlayEl.find('.home .team-name').text(game.home_team_name);
                overlayEl.find('.home .team-stats').text(`(${game.away_win}-${game.home_loss})`);
                overlayEl.find('.home .team-runs').text(game.linescore.r.home);
                overlayEl.find('.home .team-hits').text(game.linescore.h.home);
                overlayEl.find('.home .team-errors').text(game.linescore.e.home);

                overlayEl.fadeIn();

            } else {
                overlayEl.fadeOut();
            }

        }
        return this;
    }
}(jQuery));