//TODO: bookmarks
//better search:
//keywords instead of literal
//OR support

//PRO Tips:
//after typing your terms, push tab, then space to quickly start your search

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
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
            var dice_faces = {
                1:"&#9856;",
                2:"&#9857;",
                3:"&#9858;",
                4:"&#9859;",
                5:"&#9860;",
                6:"&#9861;"
            };
            var lawnchair = Lawnchair({name:'lawnchair'},function(e){
                console.log('storage open');
            });
            var papers_db = Lawnchair({name:'papers_db'},function(e){
                console.log('papers db open');
            });
            var articles_db = Lawnchair({name:'articles_db'},function(e){
                console.log('articles db open');
            });
            //view controls
            $(document).on("click", '.shw', function(e){
                var id = $(this).attr("id");
                var vname = id.replace("show_", "");
                vname = "#"+vname + "_view";
                $(".vw").hide();                
                $(vname).show();
                console.log(vname);

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
                
                //not strictly necessary

            }
            function between_turn(){
                $('#turn_total_sum').text('');
                $('#turn_total_parts').text('');
                results_this_turn = [];
                //check win/loss state here
                if(my_total >= 100){
                    //set player won
                }else if(opponents_total >= 100){
                    //set opponent won
                }else{
                    //no winner yet
                    isMyTurn = (isMyTurn == false);
                    if(isMyTurn){
                        take_player_turn();
                    }else{
                        take_ai_turn();
                    }
                }
            }
            function take_ai_turn(){
                $('button').attr('disabled', true);
                setTimeout(do_ai_turn, 200);
            }
            function do_ai_turn(){
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
                $('#opponents_total').text(opponents_total.toString());
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
                var total = turn_total(results_this_turn);
                my_total = total + my_total;
                $('#my_total').text(my_total.toString());
                between_turn();
            });

        }); // end lawnchair shit and jquery block
    } //done with report
}; //done defining app
