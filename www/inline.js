var lastTarget;         //Used to turn on and off highlighting on list items
var lastId;             //Stores the Opportunity ID for the selected List Items
var navContext;         //Stores the current navBar selection
var lastSearchTerm="";  //Stores the last Search Term
var debug = false;      //Turn on to get lots of debugging messages

function regLinkClickHandlers() {
    var $j = jQuery.noConflict();

    // Need the pagehide event to fire when the back button is clicked. We need this event to refresh the Opportunity List when the "back" button is clicked.
    
    $j(document).on("pagehide", '#recorddetail', function() {
                    if (debug) {
                       alert("in pagehide");
                    alert(navContext);
                    }
                    if(navContext.indexOf("Search") >= 0) {
                       if (debug) {
                        alert(lastSearchTerm);
                       }
                        performSearch(lastSearchTerm);
                    } else if (navContext.indexOf("Deal Contribution") >= 0){
                    if (debug) {
                        alert(navContext);
                    }
                        $j('#navbar').trigger('click');
                    }
                   });
    
    // This event is used to count the characters for the SE Next Steps field. We cannot allow more than 255 characters.
    $j(document).on("input",'#senextsteps',function(e) {
                    // alert("key Press");
                    var seNextSteps = $j('#senextsteps').val();
                    var remaining = 255 - seNextSteps.length;
                    $j('.nextstepscountdown').text(remaining + ' characters remaining');
                    });
    
    
    $j(document).on("input",'#secomments',function(e) {
                    // alert("key Press");
                    var seNextSteps = $j('#secomments').val();
                    var remaining = 255 - seNextSteps.length;
                    $j('.commentscountdown').text(remaining + ' characters remaining');
                    });
    

    // Fires when a term is entered in the Search text input.
    $j(document).on("change",'#searchbar',function(e) {
                    //hide the keyboard
                    var int = 1;
                    if (this.value == "") {
                    $j('#searchbar').focus();
                    } else {
                    $j('#searchbar').blur();
                    }
                    //if (last) {
                    //    int = e.timeStamp - last;
                    //   // alert( "time since last event" + int );
                    // }
                    // last = e.timeStamp;
                    
                    // this handler fires twice in rapid succession. It is getting two change events quickly. One from the input submit and the other from the blur event. We only want to do the search once. We look at the timestamps to determine when to fire the search. We get a negative number on one event. Ignore the positve timestamp and only fire on the negative.
                    
                    var searchTerm = this.value;
                    if (this.value != "") {
                       performSearch(this.value);
                      lastSearchTerm = this.value;
                    
                    }
                    });

    // Fires when the NavBar is clicked
    $j(document).on("click",'#navbar',function(e) {
                     $j('#searchbox').hide();
                    navContext = $j('a.ui-btn-active').text();
                    if (debug) {
                        alert (navContext);
                    }
                    if (navContext.indexOf("Recent") >= 0) {
                       $j('#radiodeal').hide();
                       forcetkClient.recent(onSuccessRecentOppty, onErrorSfdc);
                    } else if (navContext.indexOf("Search") >= 0 ) {
                    // $j.mobile.changePage('#searchpage');
                    if (debug) {
                       alert("in navbar Search");
                    }
                       $j('#searchbox').show();
                       $j('#radiodeal').show();
                    
                    if (lastSearchTerm == "") {
                        $j("#div_oppty_list").html("");

                    } else {
                        performSearch(lastSearchTerm);
                    }

                    } else if (navContext.indexOf("Deal Contribution") >= 0 ) {
                    if (debug) {
                      alert("in navbar DC");
                    }
                    $j('#radiodeal').show();
                    var selectStr = "SELECT SE_Full_name__c,Name, Opportunity__r.Name,Opportunity__r.Id,Opportunity__r.SE_Comments__c,Opportunity__r.SE_Next_Steps__c,Opportunity__r.Amount,Opportunity__r.CloseDate,Opportunity__r.StageName from Deal_Contribution__c where Opportunity__r.isClosed = false AND SE_User_ID__c = '" + forcetkClient.userId + "'";
                      forcetkClient.query(selectStr, onDealContributionSuccessOppty, onErrorSfdc);
                    } else if (navContext.indexOf("History") >= 0 ) {
                        $j('#radiodeal').hide();
                        showOpptyHistory();
                    }else {
                       alert("failed navbar");
                    }
                    });

    // Fires when the Submit button is clicked
    $j(document).on("click",'#Comments-submit',function(e) {
                    var myObj = new Object;
                    var secomments = $j('#secomments').val();
                    var seNextSteps = $j('#senextsteps').val();
                    var lisecomments = $j('#lisecomments').text();
                    var linextsteps =  $j('#linextsteps').text();

                    var test = false;
                    
                   
                    if (secomments.length >= 0 && secomments.length <= 255 && secomments != lisecomments) {
                       myObj.SE_Comments__c = secomments;
                        test = true;    
                    }
                    if (seNextSteps.length >= 0 && seNextSteps.length <= 255 && linextsteps != seNextSteps) {
                        myObj.SE_Next_Steps__c = seNextSteps;
                        test = true;
                    }
                    
                    //var str = { "SE_Comments__c" : $j('#secomments').val() };
                    // need to sleep for awhile to wait for call to finish.;
                    if (test == true) {
                       //alert(JSON.stringify(myObj));
                       $j.mobile.showPageLoadingMsg();
                       forcetkClient.update("Opportunity", lastId, myObj, onOpptyUpdate, onErrorSfdc);

                    } else {
                        alert ('Cannot submit SE Comments or Next Step entries.')
                    }
                    });
    
    // Fires when a list item is tapped
    $j(document).on("tap",'.oppty-details',function(e) {
                    // dont let the click propagate
                    if (debug) {
                    alert(" in oppty details tap");
                    }
                    e.preventDefault();
                    onOpptyItemTap();
                    });
    
    // Fires when the clear history button is tapped fromthe Options page
    $j(document).on("click",'#link_clearhistory',function(e) {
                    clearAllSearchTermHistory();
                    });

    // Fires when the "All Deals/100k filter is tapped
    $j(document).on("change",'.deals',function(e) {
                  //  alert("deals");
                    if (navContext == "Deal Contribution") {
                    $j.mobile.showPageLoadingMsg();
                    var selectStr = "SELECT SE_Full_name__c,Name, Opportunity__r.Name,Opportunity__r.Id,Opportunity__r.SE_Comments__c,Opportunity__r.SE_Next_Steps__c,Opportunity__r.Amount,Opportunity__r.CloseDate,Opportunity__r.StageName from Deal_Contribution__c where Opportunity__r.isClosed = false AND SE_User_ID__c = '" + forcetkClient.userId + "'";
                    forcetkClient.query(selectStr, onDealContributionSuccessOppty, onErrorSfdc);
                    } else if (navContext == "Search"){
                       $j('#searchbar').trigger('change');
                    }
                    });

    // Fires when the logout button is clicked
    $j(document).on("click",'#link_logout',function(e) {
                    var sfOAuthPlugin = cordova.require("salesforce/plugin/oauth");
                    sfOAuthPlugin.logout();
                    });
    
}

// This callback is used to update the Record Details after the SE Comments and Next Steps are submitted. We want to wait 5 seconds before submitting this request. 
function onOpptyUpdate () {
    //alert("op");
    setTimeout(forcetkClient.retrieve("Opportunity",lastId, null, onOpptyItem, onErrorSfdc),5000);
}

// Deal Contribution callback used to build DC opportunity list
function onDealContributionSuccessOppty(response) {
    var $j = jQuery.noConflict();
    
    $j("#div_oppty_list").html("");
    var ul = $j('<ul data-role="listview" data-filter="true" data-inset="true" data-theme="d" data-dividertheme="a"></ul>');
    
    $j("#div_oppty_list").append(ul);
    
    if (response.length == 0) {
        ul.append($j('<li data-role="list-divider">No Results Found</li>'));
    } else {
        ul.append($j('<li data-role="list-divider">My Deal Contribution Opportunities</li>'));
    }
    $j.each(response.records, function(i, SearchResult) {
            if (SearchResult.Opportunity__r != null) {
            if (!$j('#bigdeals').prop('checked') || ($j('#bigdeals').prop('checked') && SearchResult.Opportunity__r.Amount > 100000)) {
              var newLi = $j("<li class=oppty-details id=" + SearchResult.Opportunity__r.Id + ">" +
                           SearchResult.Opportunity__r.Name + "<br>" +
                             "<span class=oppty-list-details>Next Steps: " +
                             nullCheck(SearchResult.Opportunity__r.SE_Next_Steps__c) +
                             "</span><br>" +
                        "<span class=oppty-list-details>Comments: " +
                    nullCheck(SearchResult.Opportunity__r.SE_Comments__c) +
                             "</span><br>" +
                             "<span class=oppty-list-details>" +
                             "Amount: " + nullCheck(SearchResult.Opportunity__r.Amount) +
                             " " + "  Close Date: " + SearchResult.Opportunity__r.CloseDate + " " +
                             "  Stage Name: " + SearchResult.Opportunity__r.StageName + "<span>" +
                           "</li>");
              ul.append(newLi);
            
            }
            }
            });
    
    $j("#div_oppty_list").trigger( "create" );
    $j.mobile.hidePageLoadingMsg();
}

// Recent opportunities callback used to build recent opportunity list
function onSuccessRecentOppty(response) {
    var $j = jQuery.noConflict();
    
    $j("#div_oppty_list").html("");
    var ul = $j('<ul data-role="listview" data-filter="true" data-inset="true" data-theme="d" data-dividertheme="a"></ul>');
    
    $j("#div_oppty_list").append(ul);
    
    if (response.length == 0) {
        ul.append($j('<li data-role="list-divider">No Results Found</li>'));
    } else {
        ul.append($j('<li data-role="list-divider">My Recent Salesforce Opportunities</li>'));
    }
    $j.each(response, function(i, SearchResult) {
            if (SearchResult.attributes.type == "Opportunity") {
              var newLi = $j("<li class=oppty-details id=" + SearchResult.Id + ">" +
                           SearchResult.Name +
                           "</li>");
            ul.append(newLi);
            }
            });
    
    $j("#div_oppty_list").trigger( "create" );
    $j.mobile.hidePageLoadingMsg();
}


// This fires when opporunity is tapped. It builds the record detail page for the oppty
function onOpptyItemTap() {
    var target = $j( event.target );
    
    
        // we need to find the parent element if a child element is tapped.
        while (target.get(0).nodeName.toUpperCase() != "LI") {
            target=target.parent();
        }
        target.removeClass("chatter");
        target.removeClass("chatter-li-comment");
        target.addClass("ui-btn-active");
        var id = target.attr("id");    
    
        forcetkClient.retrieve("Opportunity",id, null, onOpptyItem, onErrorSfdc);
    
        $j.mobile.changePage('#recorddetail', { transition: "slide"});
        lastTarget=target;
        lastId = id;
}


// Builds the Record Details page when the oppty item is tapped. 
function onOpptyItem(response) {
    var $j = jQuery.noConflict();
    
    $j("#record_details").html("");
    
    var htmlStr = "";
    
    if (response.attributes.type == "Opportunity") {
        htmlStr = "<div class=contact-div>" + "<div class=contact-title>Name</div>" + "<div class=contact-value>" + response.Name + "</div></div>" +
        "<div class=contact-div><div class=contact-title>Amount</div>" + "<div class=contact-value>" + nullCheck(response.Amount)	+ "</div></div>" +
        "<div class=contact-div><div class=contact-title>Close Date</div>" + "<div class=contact-value>" + nullCheck(response.CloseDate)	+ "</div></div>" +
        "<div class=contact-div><div class=contact-title>Stage</div>" + "<div class=contact-value>" + nullCheck(response.StageName)	+ "</div></div>" +
        "<div class=contact-div><div class=contact-title>SE Next Steps</div>" + "<div class=contact-value id=linextsteps>" + nullCheck(response.SE_Next_Steps__c)	+ "</div></div>" +
        "<div class=contact-div><div class=contact-title>SE Comments</div>" + "<div class=contact-value id=lisecomments>" + nullCheck(response.SE_Comments__c)	+ "</div></div>" +
        "<div class=contact-div><div class=contact-title>SE Comments History</div>" + "<div class=contact-value>" + nullCheck(response.SE_Comments_History__c)	+ "</div></div>" +
        "<div data-role=fieldcontain> " +
        "<label for=senextsteps>SE Next Steps:</label>" +
        "<div><textarea name=senextsteps id=senextsteps>" + nullCheck(response.SE_Next_Steps__c) + "</textarea>" +
        "<div><span class=nextstepscountdown>" + nullLength(response.SE_Next_Steps__c) +
        " characters remaining</span></div></div>" +
        "<br><label for=secomments>SE Comments:</label>" + 
        "<div><textarea name=secomments id=secomments>" + nullCheck(response.SE_Comments__c) + "</textarea>" +
        "<div><span class=commentscountdown>" + nullLength(response.SE_Comments__c) +
        " characters remaining</span></div></div>" +
        "<a href=# id=Comments-submit data-role=button  data-inline=true data-theme=b>Submit</a>" +
        "</div>" +
        "</div></a>";
    }
    addToHistory(response.Name,response.Id);
    $j("#record_details").html(htmlStr);
    $j("#record_details").trigger( "create" )
    $j.mobile.hidePageLoadingMsg();
    lastTarget.removeClass("ui-btn-active");

}

// replaces null strings with blank strings
function nullCheck(str) {
    if (str == null) {
        return "";
    } else {
        return str;
    }
}

// returns the length of a string for the string countdown display
function nullLength(str) {
    if (str == null || str == "255") {
        return "255";
    } else {
        var x = str.length;
        return 255 - x;
    }
}

// Error reporting call back
function onErrorSfdc(error) {
    alert(JSON.stringify(error));
    $j.mobile.hidePageLoadingMsg();
}

// Builds the content for the "History" tab. We store in the History in persistent HTML5 storage.
function addToHistory (searchTerm, searchId) {
    
    if (searchTerm != null) {
        var localStore = window.localStorage;
        
        if (localStore.getItem("searchHistory") == null) {
            localStore.setItem("searchHistory","");
        }
        
        localStore.setItem("lastTerm", searchTerm);
        var searchTerms = localStore.getItem("searchHistory").split("||");
        if (searchTerm != searchTerms[0] && !isInHistory(searchTerm, searchId)) {
            localStore.setItem("searchHistory", searchTerm + ":::" + searchId + "||" + localStore.getItem("searchHistory"));
        }
    }
}

// Clears all Search History
function clearAllSearchTermHistory () {
    
    window.localStorage.removeItem("searchHistory");
    
    alert("Search History Cleared");
    
}

// Is the item already in the History
function isInHistory (searchTerm, searchId) {
    
    if (searchTerm != null) {
        var localStore = window.localStorage;
               
        var searchTerms = localStore.getItem("searchHistory").split("||");
        for (i = 0; i < searchTerms.length; i++) {
            var str = searchTerm + ":::" + searchId;
            if (str == searchTerms[i]) {
                return true;
            }
        }
        return false;
    }
}

// Callback to build History Opportunity List
function showOpptyHistory() {
    var $j = jQuery.noConflict();
    
    $j("#div_oppty_list").html("");
    var ul = $j('<ul data-role="listview" data-filter="true" data-inset="true" data-theme="d" data-dividertheme="a"></ul>');
    
    $j("#div_oppty_list").append(ul);
    
    
    var storage = window.localStorage;
    var searchHistory = storage.getItem("searchHistory");
    
    if (searchHistory == null || searchHistory.length == 0) {
        
        ul.append($j('<li data-theme="d" data-role="list-divider">No History Found</li>'));
    } else {
        ul.append($j('<li data-theme="d" data-role="list-divider">Opportunity History</li>'));
        
        var searchTerms = searchHistory.split("||");
        for (var i = 0; i < searchTerms.length; i++) {
            if (searchTerms[i] != null && searchTerms[i] != "") {
                opptyName = searchTerms[i].split(":::");
                
                var newLi = $j("<li class=oppty-details id=" + opptyName[1] + ">" +
                               opptyName[0] + "</li>");
                ul.append(newLi);
            }
            
        }
    }
    $j("#div_oppty_list").trigger( "create" );
    $j.mobile.hidePageLoadingMsg();
    
}

// This function perform the SOSL search for opportunities from the Search Term entered in the search text input
function performSearch(searchString) {
    if (searchString == null) return false;
    var $j = jQuery.noConflict();
    
    
    if (searchString.length > 1) {
        $j.mobile.showPageLoadingMsg();
        
            forcetkClient.search("FIND {" + searchString + "} IN ALL FIELDS Returning Opportunity(Name,Id,isClosed,Amount,AccountId,StageName,CloseDate,SE_Next_Steps__c, SE_Comments__c)  LIMIT 200", onSuccessSearch, onErrorSfdc);
        
        }
        //udpate text in searchbox
        $j('#searchbar').val(searchString);
        

}

// The callback that builds the Search Opportunity List. The SOSL response object has a different structure so we need a separate function to handle the results.
function onSuccessSearch (response) {
    var $j = jQuery.noConflict();
    
    $j("#div_oppty_list").html("");
    var ul = $j('<ul data-role="listview" data-filter="true" data-inset="true" data-theme="d" data-dividertheme="a"></ul>');
    
    $j("#div_oppty_list").append(ul);
    
    if (response.length == 0) {
        ul.append($j('<li data-role="list-divider">No Results Found</li>'));
    } else {
        ul.append($j('<li data-role="list-divider">Salesforce Opportunities Search Result</li>'));
    }
    $j.each(response, function(i, SearchResult) {
            if (SearchResult.attributes.type == "Opportunity" && SearchResult.IsClosed == false) {
             if (!$j('#bigdeals').prop('checked') || ($j('#bigdeals').prop('checked') && SearchResult.Amount > 100000)) {

//                var newLi = $j("<li class=oppty-details id=" + SearchResult.Id + ">" +
//                           SearchResult.Name +
//                           "</li>");
//                  ul.append(newLi);
                var newLi = $j("<li class=oppty-details id=" + SearchResult.Id + ">" +
                           SearchResult.Name + "<br>" +
                           "<span class=oppty-list-details>Next Steps: " +
                           nullCheck(SearchResult.SE_Next_Steps__c) +
                           "</span><br>" +
                           "<span class=oppty-list-details>Comments: " +
                           nullCheck(SearchResult.SE_Comments__c) +
                           "</span><br>" +
                           "<span class=oppty-list-details>" +
                           "Amount: " + nullCheck(SearchResult.Amount) +
                           " " + "  Close Date: " + SearchResult.CloseDate + " " +
                           "  Stage Name: " + SearchResult.StageName + "<span>" +
                               "</li>");
                ul.append(newLi);


              }
             }
            });
    
    $j("#div_oppty_list").trigger( "create" );
    $j.mobile.hidePageLoadingMsg();
    
}