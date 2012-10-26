//needed to specify port
//needed to put socket.io.js in a local folder
var SERVER_DOMAIN = "localhost";
var SERVER_PORT = "8080"; 
//should probably use https rofl
var socket = io.connect('http://'+SERVER_DOMAIN+':'+SERVER_PORT);
var app = {
    initialize: function() {
        this.bind();
        console.log("initialize bound");
    },
    bind: function() {
        // document.addEventListener('deviceready', this.deviceready, false);
        // console.log("listener bound");
        var ms = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/);
        var ua = navigator.userAgent.toString();
        if (ms != null) {
            $("#status").text("mobile: "+ua+" user agent is mobile, we are in PhoneGap");
            document.addEventListener('deviceready', this.deviceready, false);
        } else {
            $("#status").text("pc: "+ua+" user agent did not match, assuming PC, we are in Chrome App");
            this.deviceready();
        }
        console.log("listener bound");
        console.log("user agent is: "+ua);
    },
    deviceready: function() {
        // This is an event handler function, which means the scope is the event.
        // So, we must explicitly called `app.report()` instead of `this.report()`.
        $("#status").text("");
        app.report('deviceready');
    },
    report: function(id) {
        // Report the event in the console
        console.log("Report: " + id);

        // // Toggle the state from "pending" to "complete" for the reported ID.
        // // Accomplished by adding .hide to the pending element and removing
        // // .hide from the complete element.
        // document.querySelector('#' + id + ' .pending').className += ' hide';
        // var completeElem = document.querySelector('#' + id + ' .complete');
        // completeElem.className = completeElem.className.split('hide').join('');
        //testing out lawnchair.js
        $(function(e) {
            //db
            var lawnchair = Lawnchair({name:'lawnchair'},function(e){
                console.log('storage open');
                initDB(lawnchair);
                setTimeout(function(){
                    lawnchair.get('local_stats', function(obj){
                        var ls = obj.value;
                        $('#wins_count').text(ls["vs_ai"]["wins"]);
                        $('#losses_count').text(ls["vs_ai"]["losses"]);
                    })
                }, 400);
            });
            function initDB(db){
                db.exists('wasSetup', function(bool){
                    if(bool){
                        //do nothing herp derp, maybe analytics
                    }else{
                        db.save({key:'wasSetup', value:'true'});
                        var ls = {};
                        var vs_ai = {};
                        vs_ai["wins"] = 0;
                        vs_ai["losses"] = 0;
                        ls["vs_ai"] = vs_ai;
                        //consider adding stats per kind of ai
                        db.save({key:'local_stats', value:ls})
                    }
                });
                db.get('credentials', function(data){
                  var cred = data.value;
                  socket.emit('log_in', data);
                  console.log('trying log_in');
                })
            }
            var games_db = Lawnchair({name:'games_db'},function(e){
              console.log('games db open');
            });
    //netcode
            var active_game_id = null;
            socket.on('message', function(data){
              console.log(data);
              $('#messages').find('ul').append('<li>'+data+'</li>');
            });
            socket.on('status', function(data){
              console.log(data);
              $('#status').text(data);
            });
            socket.on('log_in', function(data){
              console.log(data);
              $('#status').text(JSON.stringify(data));
              $('#messages').find('ul').append('<li>'+JSON.stringify(data)+'</li>');
            });
            socket.on('new_ladder_game', function(data){
              console.log(data);
              $('#messages').find('ul').append('<li>'+data+'</li>');
            });
            socket.on('create_game', function(data){
              console.log(data);
              //created game on the server, do something with that info
              games_db.save({key:data['id'], value:data});
              //consider a separate game list
              $('#my_games_view').find('ul').append('<li><button class="btn btn-block btn-large btn-primary shw" id=\'show_game_'+data['game_id']+'\'> A Challenger Appears! '+data['opponent_name']+'!</button></li>');
              //create the game view
              $('#my_games_view').find('button').last().click(function(e){
                var id = $(this).attr("id");
                var vname = id.replace("show_", "");
                // vname = "#"+vname + "_view";
                //for now we're just manipulating the game_view
                //this should prolly be different somehow though
                vname = "#game_view";
                $(".vw").hide();                
                $(vname).show();
                console.log(vname);
                var game_id = id.replace('show_game_', '');
                games_db.get(game_id, function(data){
                  var game_data = data.value;
                  $('#opponents_name').text(game_data['opponent_name']);
                });
              });
            });
            socket.on('start_turn', function(game_id){
              console.log(game_id);
              if(active_game_id == null || active_game_id == game_id){
                active_game_id = game_id;
                isMyTurn = true;
                //notify that it's the user's turn 
              }else{
                //notify the user that this game is ready for them to take their turn
              }
            });
            socket.on('end_turn', function(game_id){
              console.log(game_id);
              if(active_game_id == null || active_game_id == game_id){
                active_game_id = game_id;
                isMyTurn = true;
                //show that it's the other person who has to act, that they're taking their turn
              }else{
                //notify that they're waiting for the opponent to make a move
              }
            });
            socket.on('roll', function(data){
              console.log(data);
              //should have a result object
              var game_id = data["game_id"];
              if(active_game_id == game_id){
                //affect the ui to indicate the roll
                //this could be fancier...
                $('#die1').html(dice_faces[data["first"]]);
                $('#die2').html(dice_faces[data["second"]]);
                $('#roll_result').text(data["roll_result"] + ' = ' + data["first"].toString()+' + '+data["second"].toString());
                update_ui_post_roll(the_roll);
                if(data['roller'] == true){
                  //
                  $('#do_hold').attr('disabled', false);
                }else if(data['roller'] == false){
                  //
                  //may not be neccesary
                  //$('#do_hold').attr('disabled', true);
                  //$('#do_roll').attr('disabled', true);
                }
              }else{
                //update game data in the background, and allow user to respond
                if(data){
                  //i dont know...
                }
              }
            });
            socket.on('hold', function(game_id){
              //assuming that this is a hold called by the opponent
              if(active_game_id == null || active_game_id == game_id){
                active_game_id = game_id;
                var total = turn_total(results_this_turn);
                opponents_total = total + opponents_total;
                console.log(opponents_total);
                $('#opponents_total').text(opponents_total.toString());
              }else{
                //background game, do something with that
              }
            })
            //constants
            var dice_faces = {
              1:"&#9856;",
              2:"&#9857;",
              3:"&#9858;",
              4:"&#9859;",
              5:"&#9860;",
              6:"&#9861;"
            };
            
            //view controls
            $(document).on("click", '.shw', function(e){
              var id = $(this).attr("id");
              var vname = id.replace("show_", "");
              vname = "#"+vname + "_view";
              $(".vw").hide();                
              $(vname).show();
              console.log(vname);
            });
            $(document).on('click', '#do_login', function(e){
              var bt = $(this);
              bt.attr('disabled', true);

              var data = {}
              data['email'] = $('#email').val();
              data['username'] = $('#display_name').val();
              data['password'] = $('#password').val();
              //do null checking, validate existence of all above
              
              lawnchair.save({key:'credentials', value:data});
              setTimeout(function(){
                bt.attr('disabled', false);
              }, 2000);
              $('#show_home').click();
            });
            $(document).on("click", '#do_findmatch', function(e){
              var bt = $(this);
              bt.attr('disabled', true);
              socket.emit('new_ladder_game', 'woohoo!');              
            });
            var results_this_turn = [];
            var isMyTurn = true;
            var my_total = 0;
            var opponents_total = 0;
            var cur_ai = hold_after_16;
            function reset_game(){
              isMyTurn = true;
              my_total = 0;
              opponents_total = 0;
              $('#my_total').text('0');
              $('#opponents_total').text('0');
              $('#roll_result').text('');
            }
            $('#show_game').click(function(){
                reset_game();
            });
            function between_turn(){
                $('#turn_total_sum').text('');
                $('#turn_total_parts').text('');
                results_this_turn = [];
                //check win/loss state here
                if(my_total >= 100 || opponents_total >= 100){
                    if(my_total >= 100){
                        //set player won
                        lawnchair.get('local_stats', function(obj){
                            var ls = obj.value;
                            ls["vs_ai"]["wins"] = ls["vs_ai"]["wins"] + 1;
                            $('#wins_count').text(ls["vs_ai"]["wins"]);
                            lawnchair.save({key:obj.key, value:ls});
                        });
                        alert('you won');
                    }else if(opponents_total >= 100){
                        //set opponent won
                        lawnchair.get('local_stats', function(obj){
                            var ls = obj.value;
                            ls["vs_ai"]["losses"] = ls["vs_ai"]["losses"] + 1;
                            $('#losses_count').text(ls["vs_ai"]["losses"]);
                            lawnchair.save({key:obj.key, value:ls});
                        });
                        alert('you lost');
                    }
                }else{
                    //no winner yet
                    isMyTurn = (isMyTurn == false);
                    if(isMyTurn){
                        console.log('player\'s turn');
                        $('#status').text('player\'s turn');
                        take_player_turn();
                    }else{
                        console.log("opponent\'s turn");
                        $('#status').text('opponent\'s turn');
                        take_ai_turn();
                    }
                }
            }
            function take_ai_turn(){
                $('button').attr('disabled', true);
                setTimeout(do_ai_turn, 200);
            }
            function do_ai_turn(){
              console.log('ai turn');
              var the_roll = roll();
              if(the_roll["bust"] == false){
                //AI Logic Here
                var descision = cur_ai(opponents_total, my_total, turn_total(results_this_turn));
                if(descision == "roll"){
                  setTimeout(do_ai_turn, 200);
                }else if(descision == "hold"){
                  setTimeout(do_ai_hold, 200);
                }
                update_ui_post_roll(the_roll);
              }else if(the_roll["bust"] == true){
                setTimeout(between_turn, 200);
              }
            }
            function hold_after_16(op_total, m_total, t_total){
              if(t_total < 16){
                return "roll";
              }else{
                return "hold";
              }
            }
            function do_ai_hold(){
              var total = turn_total(results_this_turn);
              opponents_total = total + opponents_total;
              console.log(opponents_total);
              $('#opponents_total').text(opponents_total.toString());
              between_turn();
            }
            function do_player_hold(){
              var total = turn_total(results_this_turn);
              my_total = total + my_total;
              $('#my_total').text(my_total.toString());
              between_turn();
            }
            function take_player_turn(){
              $('button').attr('disabled', false);
              $('#do_hold').attr('disabled', true);
            }
            function turn_total(a_turns_results){
              var total = 0;
              $.each(a_turns_results,function() {
                total += this;
              });
              return total;
            }
            function roll(){
              var retval = {};
              retval["first"] = Math.floor(Math.random()*5)+1;
              retval["second"] = Math.floor(Math.random()*5)+1;
              retval["roll_result"] = (retval["first"] + retval["second"]).toString();
              $('#die1').html(dice_faces[retval["first"]]);
              $('#die2').html(dice_faces[retval["second"]]);
              $('#roll_result').text(retval["roll_result"] + ' = ' + retval["first"].toString()+' + '+retval["second"].toString());
              if(retval["first"] == 1 || retval["second"] == 1){
                retval["bust"] = true;
              }else{
                retval["bust"] = false;
              }
              return retval;
            }
            function update_ui_post_roll(the_roll){
              results_this_turn.push(the_roll["first"] + the_roll["second"]);
              //console.log(results_this_turn);
              var total = turn_total(results_this_turn);
              if(results_this_turn.length > 1){
                $('#turn_total_parts').text(' = '+results_this_turn.join(' + '));
              }
              $('#turn_total_sum').text('Total: '+total.toString());
            }
            $(document).on("click", '#do_roll', function(e){
              var the_roll = roll();
              if(the_roll["bust"] == false){
                update_ui_post_roll(the_roll);
                $('#do_hold').attr('disabled', false);
              }else if(the_roll["bust"] == true){
                //change turn
                between_turn();
              }
            });
            $(document).on("click", '#do_hold', function(e){
              do_player_hold();
            });
        }); // end lawnchair shit and jquery block
    } //done with report
}; //done defining app
