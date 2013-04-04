//Sample code for Hybrid REST Explorer

var lastTarget;
var lastId;
var nextStepStr = "";
var seComentsStr = "";

function regLinkClickHandlers() {
    var $j = jQuery.noConflict();
     
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
                    }
                    });

    
    $j(document).on("click",'#navbar',function(e) {
                     $j('#searchbox').hide();
                    navContext = e.target.innerText;
                    if (navContext == "Recent") {
                       $j('#radiodeal').hide();
                       forcetkClient.recent(onSuccessRecentOppty, onErrorSfdc);
                    } else if (navContext == "Search") {
                       // $j.mobile.changePage('#searchpage');
                       $j('#searchbox').show();
                       $j('#radiodeal').show();

                    } else if (navContext == "Deal Contribution") {
                    $j('#radiodeal').show();
                    var selectStr = "SELECT SE_Full_name__c,Name, Opportunity__r.Name,Opportunity__r.Id,Opportunity__r.SE_Comments__c,Opportunity__r.SE_Next_Steps__c,Opportunity__r.Amount from Deal_Contribution__c where Opportunity__r.isClosed = false AND SE_User_ID__c = '" + forcetkClient.userId + "'";
                      forcetkClient.query(selectStr, onDealContributionSuccessOppty, onErrorSfdc);
                    } else if (navContext == "History") {
                        $j('#radiodeal').hide();
                        showOpptyHistory();
                    }else {
                      forcetkClient.query("SELECT Id, Name FROM Opportunity LIMIT 10", onSuccessOppty, onErrorSfdc);
                    }
                    });
    

    
    $j(document).on("click",'#Comments-submit',function(e) {
                    var myObj = new Object;
                    var secomments = $j('#secomments').val();
                    var seNextSteps = $j('#senextsteps').val();
                    var lisecomments = $j('#lisecomments').text();
                    var linextsteps =  $j('#linextsteps').text();

                    var test = false;
                    
                   
                    if (secomments.length > 0 && secomments != lisecomments) {
                       myObj.SE_Comments__c = secomments;
                        test = true;    
                    }
                    if (seNextSteps.length > 0 && linextsteps != seNextSteps) {
                        myObj.SE_Next_Steps__c = seNextSteps;
                        test = true;
                    }
                    
                    //var str = { "SE_Comments__c" : $j('#secomments').val() };
                    // need to sleep for awhile to wait for call to finish.;
                    if (test == true) {
                       //alert(JSON.stringify(myObj));
                       forcetkClient.update("Opportunity", lastId, myObj, onOpptyUpdate, onErrorSfdc);
                    }
                    });
    
    $j(document).on("tap",'.oppty-details',function(e) {
                    // dont let the click propagate
                    e.preventDefault();
                    onOpptyItemTap();
                    });
    
    $j(document).on("click",'#link_clearhistory',function(e) {
                    clearAllSearchTermHistory();
                    });

    $j(document).on("change",'.deals',function(e) {
                  //  alert("deals");
                    if (navContext == "Deal Contribution") {
                    var selectStr = "SELECT SE_Full_name__c,Name, Opportunity__r.Name,Opportunity__r.Id,Opportunity__r.SE_Comments__c,Opportunity__r.SE_Next_Steps__c,Opportunity__r.Amount from Deal_Contribution__c where Opportunity__r.isClosed = false AND SE_User_ID__c = '" + forcetkClient.userId + "'";
                    forcetkClient.query(selectStr, onDealContributionSuccessOppty, onErrorSfdc);
                    } else if (navContext == "Search"){
                       $j('#searchbar').trigger('change');
                    }
                    });

    
    $j(document).on("click",'#link_logout',function(e) {
                    var sfOAuthPlugin = cordova.require("salesforce/plugin/oauth");
                    sfOAuthPlugin.logout();
                    });
    
}

function onOpptyUpdate () {
    //alert("op");
    setTimeout(forcetkClient.retrieve("Opportunity",lastId, null, onOpptyItem, onErrorSfdc),5000);
}


function onSuccessOppty(response) {
    var $j = jQuery.noConflict();

    $j("#div_oppty_list").html("");
    var ul = $j('<ul data-role="listview" data-filter="true" data-inset="true" data-theme="d" data-dividertheme="a"></ul>');
    
    $j("#div_oppty_list").append(ul);
    
    if (response.length == 0) {
        ul.append($j('<li data-role="list-divider">No Results Found</li>'));
    } else {
        ul.append($j('<li data-role="list-divider">My Salesforce Opportunities</li>'));
    }
    $j.each(response.records, function(i, SearchResult) {
            var newLi = $j("<li class=oppty-details id=" + SearchResult.Id + ">" +
                           SearchResult.Name + "<br>" +
                           "<span class=chatter-li-timestamp>Next Steps: " +
                           nullCheck(SearchResult.SE_Next_Steps__c) +
                           "</span><br>" +
                           "<span class=chatter-li-timestamp>Comments: " +
                           nullCheck(SearchResult.SE_Comments__c) +
                           "</span><br>" +

                          "</li>");
            ul.append(newLi);
            
            });
    
    $j("#div_oppty_list").trigger( "create" );
    $j.mobile.hidePageLoadingMsg();
}

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
                             "<span class=chatter-li-timestamp-comment>Next Steps: " +
                             nullCheck(SearchResult.Opportunity__r.SE_Next_Steps__c) +
                             "</span><br>" +
                        "<span class=chatter-li-timestamp-comment>Comments: " +
                    nullCheck(SearchResult.Opportunity__r.SE_Comments__c) +
                             "</span><br>" +
                             
                          // "<label for=name>SE Next Steps:</label>" +
                          //  "<input type=text name=name id=name />" +
                          //   "<label for=name>SE Comments:</label>" +
                          //   "<input type=text name=name id=name />" +
                           "</li>");
              ul.append(newLi);
            }
            }
            });
    
    $j("#div_oppty_list").trigger( "create" );
    $j.mobile.hidePageLoadingMsg();
}

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

function onErrorSfdc() {
    alert("error");
}

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
    
        $j.mobile.changePage('#recorddetail');
        lastTarget=target;
        lastId = id;

    

}

function refreshOpptyItemTap() {    
    forcetkClient.retrieve("Opportunity",lastId, null, onOpptyItem, onErrorSfdc);
}

function onOpptyItem(response) {
    var $j = jQuery.noConflict();
    
    $j("#record_details").html("");
    
    var htmlStr = "";
    
    
    
    if (response.attributes.type == "Opportunity") {
        
        

//        if (response.SE_Next_Steps__c == null) {
//            nextStepStr = "";
//        } else {
//            nextStepStr = response.SE_Next_Steps__c;
//        }
//        
//        if (response.response.SE_Comments__c  == null) {
//            seComentsStr = ""
//        } else {
//            seComentsStr = response.response.SE_Comments__c;
//        }
        
        htmlStr = "<div class=contact-div>" + "<div class=contact-title>Name</div>" + "<div class=contact-value>" + response.Name + "</div></div>" +
        "<div class=contact-div><div class=contact-title>Amount</div>" + "<div class=contact-value>" + nullCheck(response.Amount)	+ "</div></div>" +
        "<div class=contact-div><div class=contact-title>Close Date</div>" + "<div class=contact-value>" + nullCheck(response.CloseDate)	+ "</div></div>" +
        "<div class=contact-div><div class=contact-title>Stage</div>" + "<div class=contact-value>" + nullCheck(response.StageName)	+ "</div></div>" +
        "<div class=contact-div><div class=contact-title>SE Next Steps</div>" + "<div class=contact-value id=linextsteps>" + nullCheck(response.SE_Next_Steps__c)	+ "</div></div>" +
        "<div class=contact-div><div class=contact-title>SE Comments</div>" + "<div class=contact-value id=lisecomments>" + nullCheck(response.SE_Comments__c)	+ "</div></div>" +
        "<div class=contact-div><div class=contact-title>SE Comments History</div>" + "<div class=contact-value>" + nullCheck(response.SE_Comments_History__c)	+ "</div></div>" +
        "<div data-role=fieldcontain> " +
        "<label for=senextsteps>SE Next Steps:</label>" +
        "<textarea name=senextsteps id=senextsteps>" + nullCheck(response.SE_Next_Steps__c) + "</textarea>" +
        "<label for=secomments>SE Comments:</label>" + 
        "<textarea name=secomments id=secomments>" + nullCheck(response.SE_Comments__c) + "</textarea>" +
        "<a href=# id=Comments-submit data-role=button data-inline=true data-theme=b>Submit</a>" +
        "</div>" +
        "</div></a>";
    }
    addToHistory(response.Name,response.Id);
    $j("#record_details").html(htmlStr);
    $j("#record_details").trigger( "create" )
    $j.mobile.hidePageLoadingMsg();
    lastTarget.removeClass("ui-btn-active");

}
function nullCheck(str) {
    if (str == null) {
        return "";
    } else {
        return str;
    }
}

function onErrorDevice(error) {
    cordova.require("salesforce/util/logger").logToConsole("onErrorDevice: " + JSON.stringify(error) );
    alert('Error getting device contacts!');
}



function onErrorSfdc(error) {
    alert(JSON.stringify(error));
}


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

function clearAllSearchTermHistory () {
    
    window.localStorage.removeItem("searchHistory");
    
    alert("Search History Cleared");
    
}

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
function performSearch(searchString) {
    if (searchString == null) return false;
    var $j = jQuery.noConflict();
    
    
    if (searchString.length > 1) {
        $j.mobile.showPageLoadingMsg();
        
            forcetkClient.search("FIND {" + searchString + "} IN ALL FIELDS Returning Opportunity(Name,Id,isClosed,Amount,AccountId)  LIMIT 200", onSuccessSearch, onErrorSfdc);
        
        }
        //udpate text in searchbox
        $j('#searchbar').val(searchString);
        

}

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

                var newLi = $j("<li class=oppty-details id=" + SearchResult.Id + ">" +
                           SearchResult.Name +
                           "</li>");
                  ul.append(newLi);
              }
             }
            });
    
    $j("#div_oppty_list").trigger( "create" );
    $j.mobile.hidePageLoadingMsg();
    
}