$( document ).ready( drawViz );
function drawViz() {
    $("#loading").addClass("isloading").text('Loading..');
    $( "#MP" ).prop( "disabled", true );
    var comList =[], amp_lookup, amp_list=[], tpc_membership, a2z_lookup=[], a2z_index=[], a_over=[], cntQ, cntS;

    var members_hc_in       = setAjax( 'https://data.parliament.uk/membersdataplatform/services/mnis/members/query/House=Commons%7CIsEligible=true/ParliamentaryPosts%7CGovernmentPosts%7COppositionPosts/');
    var members_hl_in       = setAjax( 'https://data.parliament.uk/membersdataplatform/services/mnis/members/query/House=Lords%7CIsEligible=true/ParliamentaryPosts%7CGovernmentPosts%7COppositionPosts/');
   
    $.when(  members_hc_in, members_hl_in ).done(function (  c_hm, l_hm,  ) {
        $("#loading").removeClass("isloading").text('');
        
        amp_lookup=[].concat( c_hm[0].Members.Member, l_hm[0].Members.Member )
        amp_lookup.sort( function(a, b){
            var nameA=a.ListAs.toLowerCase(), nameB=b.ListAs.toLowerCase();
            if (nameA < nameB) //sort string ascending
            return -1;
            if (nameA > nameB)
            return 1;
            return 0; 
        });
        
        // build list of all MPs
        for (var i=0; i<amp_lookup.length; i++) {
            var tmid='m' + amp_lookup[i]['@Member_Id'];
            amp_list[tmid]={
                name: amp_lookup[i]['DisplayAs'],
                party: amp_lookup[i]['Party']['#text'],
                const: amp_lookup[i]['MemberFrom'],
                gender: amp_lookup[i]['Gender'],
                img: 'https://data.parliament.uk/membersdataplatform/services/images/MemberPhoto/' + amp_lookup[i]['@Member_Id'],
                member_since: amp_lookup[i]['HouseStartDate'],
                posts_g: amp_lookup[i]['GovernmentPosts'],
                posts_p: amp_lookup[i]['ParliamentaryPosts'],
                posts_o: amp_lookup[i]['OppositionPosts']
            }
            var taz=amp_lookup[i]['ListAs'].substring(0,1);
            if (typeof a2z_lookup[taz] == 'undefined') {
                a2z_lookup[taz] = [];
                a2z_index.push({id:taz})
            }
            a2z_lookup[taz][tmid]={name: amp_lookup[i]['ListAs'], house: amp_lookup[i]['House']};
        }
        a2z_index.sort( function(a, b){
            var nameA=a.id.toLowerCase(), nameB=b.id.toLowerCase();
            if (nameA < nameB) //sort string ascending
            return -1;
            if (nameA > nameB)
            return 1;
            return 0; 
        });
        var arrayAuto = amp_lookup.map( function(e) {
                return {'id': e['@Member_Id'], 'value': e['DisplayAs'], house:e['House'], listAs: e['ListAs']}
        })
        arrayAuto.sort( function(a, b){
            var nameA=a.listAs.toLowerCase(), nameB=b.listAs.toLowerCase();
            if (nameA < nameB) //sort string ascending
            return -1;
            if (nameA > nameB)
            return 1;
            return 0; 
        });
        // set up auto complete for MP names
        $( "#MP" ).prop( "disabled", false ).autocomplete({
            source: arrayAuto,
            minLength: 2,
            select: function( event, ui ) {
                $('#presel').text('To select another person, begin by typing their name here:');
                var tpid='m'+ui.item.id;
                var tmid=ui.item.id;
                showDetails(tpid, tmid, ui.item.house)
            }
        } ).focus( function() {
            $(this).val("")

        }
        ).autocomplete("instance")._renderItem =function( ul, item ) {
            if (item.house == 'Lords') { 
                var bgc='#9d0830'
            } else {
                var bgc='#006e46'
            }
            return $( "<li>" )
                .append( '<span style="width:12px; border: 2px solid white; background-color:' + bgc + '"> </span>' + item.label )
                .appendTo( ul );
            }
        var tl='<p>Or select a member from the alphabetical lists below.</p>';
        tl+='<p>Entries are coloured <span style="background-color: #006e46; color: white; display: inline-block">Green</span> for a member of the house of commons, ';
        tl+='and <span style="background-color: #9d0830;color: white; display: inline-block;">Red</span> for a member of the house of lords</p>'; 
        $(tl).appendTo( '#alist');
        var ih="<ul id='tindex' style='width: 250px;'>";
        for (var i=0; i<a2z_index.length; i++) {
            ih+='<li class="i_item" id="' + a2z_index[i].id + '">' + a2z_index[i].id + '</li>'
        }
        ih+='</ul>'

        $(ih).appendTo( '#alist');
        $('<div id="nameLists"></div>').appendTo( '#alist');

        $('.i_item').click( function() {
            showNameIndex( this.innerText );
        })
        
        // show random entry for opening screen
        var m12show = getRndInteger(0, amp_lookup.length);
        var sel1= amp_lookup[m12show];
        $('#presel').html('We have randomly selected <b>' + sel1['DisplayAs'] + '</b> to illustrate information available.<br>To select another person, begin by typing their name here:' )
        showDetails('m' + sel1['@Member_Id'], sel1['@Member_Id'], sel1['House'])
        showNameIndex( sel1.ListAs.substring(0,1) );

    }); // end when condition

    function showNameIndex( tl) {
        var tn = a2z_lookup[ tl ];
        
        var tl='<ul>'
        for (var j in tn) {
            if (tn[j].house == 'Lords') { 
                var bgc='#9d0830'
            } else {
                var bgc='#006e46'
            }
            tl+='<li mid="' + j + '" house="' + tn[j].house + '" class="tname" style="color: white; background-color:' + bgc + '">' + tn[j].name + '</li>';
        }
        tl+='</ul>';
        $('#nameLists').empty().html(tl);
        $('.tname').click(function() {
            $('#presel').text('To select another person, begin by typing their name here:');
            var tpid=$(this).attr('mid');
            var tmid=tpid.substring(1, tpid.length);
            showDetails(tpid, tmid, $(this).attr("house"));
        })
    } // showNameIndex( tl) 

    function showDetails(tpid, tmid, inHouse) {
        // build summary card
        if (inHouse== 'Lords') { 
            var bgc='#9d0830'
        } else {
            var bgc='#006e46'
        }
        $('#cmem').empty()
        var tms=amp_list[tpid]
        var ht='<a id="l_top"></a><table class="blueTable">'
        ht+='<tr>'
        ht+='<td colspan="3" style="height: 10px; background-color:' + bgc + '";></td>';
        ht+='</tr><tr>';
        ht+='<td style="vertical-align: top; align: right;"><img width="80" height="80" src="' + tms['img'] + '"/></td>'
        ht+='<td style="width: 370px;">'                
        ht+='<h3>' + tms.name + '</h3>'
        ht+='<p>' + tms.const + '</p>'
        ht+='</td><td "style="width: 370px;">';
        $('#MP').val(tms.name)

        ht+='<h3>' + tms.party + '</h3>'
        ht+='<p>Member since ' + $.formatDateTime("d M yy", new Date(tms.member_since)) + '</p>'
        ht+='</td>'
        ht+='</tr>'
        ht+='</table>'
        $(ht).appendTo('#cmem');
        
        $('<h2>Overview</h2>').appendTo('#cmem');
        $('<div id="Overview" style="width: 800px;"></div>').appendTo('#cmem');
        
        // show registered interests
        $('<h2>Registered interests</h2>').appendTo('#cmem');
        $('<div id="Interests" style="width: 800px;"></div>').appendTo('#cmem');

        // get and show committee membership details  - disabled on 9th Dec because API is returning limited results
        $('<div id="Committees"></div>').appendTo('#cmem');
        $("<table><tr><td><h2>Committee membership</h2></td><td><a id='l_committees' href='#l_top' class='bnav'>Back to top</a></td></tr></table>").appendTo('#Committees');
        ht = get_showCommittees(tmid);   
        $(ht).appendTo('#Committees');

        // get and show statements and questions
        $('<table><tr><td><h2>Statements and questions</h2></td><td><a id="l_qands" href="#l_top" class="bnav">Back to top</a></td></tr></table>').appendTo('#cmem');
        var cc='<figure class="highcharts-figure" style="width: 800px;">';
        cc+='<div id="qChart"></div>';
        cc+='<p class="highcharts-description" id="ccdesc"></p>';
        cc+='</figure>'
        $(cc).appendTo('#cmem');
        
        $('<div id="Questions" style="width: 800px;"></div>').appendTo('#cmem');
        a_over.qands={w:0, o:0, s: 0}
        getQuestions( tmid, inHouse);
        
        // show current and previous roles
        a_over.roles={
            Government:{c:0, p: 0},
            Opposition:{c:0, p: 0},
            Parliamentary: {c:0, p: 0}
        }
        $('<table><tr><td><h2>Roles</h2></td><td><a id="l_roles" href="#l_top" class="bnav">Back to top</a></td></tr></table>').appendTo('#cmem');
        if ( tms["posts_g"] !== null ) { var tin=tms["posts_g"]['GovernmentPost']} else {var tin=null};
        ht=rt( tin, 'Government')
        $(ht).appendTo('#cmem');

        if ( tms["posts_o"] !== null ) { var tin=tms["posts_o"]['OppositionPost']} else {var tin=null};
        ht=rt( tin, 'Opposition')
        $(ht).appendTo('#cmem');

        if ( tms["posts_p"] !== null ) { var tin=tms["posts_p"]['ParliamentaryPost']} else {var tin=null};
        ht=rt( tin, 'Parliamentary')
        $(ht).appendTo('#cmem');


        function get_showCommittees( tmid ) {
            
            a_over['commmittees'] =0;
            var tpcUrl = 'https://data.parliament.uk/membersdataplatform/services/mnis/members/query/id=' + tmid + '/Committees/'
            var r_mcm = setAjax( tpcUrl);
            $.when( r_mcm ).done(function ( d_rcm ) {
                var tcset = d_rcm.Members.Member.Committees.Committee;
                if (d_rcm.Members.Member.Committees == null) {
                    return '<p>Not a member of any committees</p>';
                }
                var tcset = d_rcm.Members.Member.Committees.Committee;
                if (typeof( tcset.length) == 'undefined') { // only one committee
                   var tcL = [], tcList=[];
                   for (var j in tcset) {
                       tcL[j] = tcset[j];
                   } 
                   tcList.push( tcL );
                } else {
                    var tcList=tcset;
                }
                procCommittees(tcList )

                function procCommittees( tcList ) {
                    var tpc_missing = [];
                    tpc_membership = [];

                    for (var i=0; i<tcList.length; i++) { // build list of committees for selected person
                        var tc= 'c' + tcList[i]['@Id'];
                        if (typeof tpc_membership[tc] == 'undefined') {
                            tpc_membership[tc] = {dates:[]}  
                        }
                        tpc_membership[tc].dates.push(
                            {s: cd( tcList[i].StartDate) , e: cd( tcList[i].EndDate )}
                        );
                    }

                    // remove duplicate dates

            
                    for (var i in tpc_membership) {    // build list of committees for which we have no details
                        if (typeof comList[i] == 'undefined') { 
                            tpc_missing.push( i );
                        }
                    }
                    if (tpc_missing.length > 0 ) { // found missing committees
                        getMissingCommittees( 0, tpc_missing, tpc_membership )

                    } else { // got all missing committees, proceed to show details
                        dispCom(tpc_membership)
                    }

                } // procCommittees( tcList, tmid )

                function getMissingCommittees( s, tpc_missing, tpc_membership ) {
                    $('<div id="cload" class="isloading">Getting data for ' + (s+1)  + ' of ' + tpc_missing.length + ' committees</div>').appendTo('#Committees');
                    var tpcid = tpc_missing[s];
                    var tcUrl = 'https://data.parliament.uk/membersdataplatform/services/mnis/Committee/' + tpcid.replace('c','') +  '/Current/';
                    var r_com = setAjax(tcUrl);
                    $.when( r_com ).done(function ( d_com ) { 
                        // add details to master array
                        var tcd=d_com.Committee.Details;
                        var tcid='c' + tcd.Committee_Id
                        comList[tcid]=[];
                        for (var j in tcd) {
                            comList[tcid][j] = tcd[j];
                        }
                        comList[tcid].members = d_com.Committee.Members
                        comList[tcid].laymembers = d_com.Committee.LayMembers

                        s++;
                        if (s == tpc_missing.length) { // got all missing committees, proceed to show details 
                            dispCom(tpc_membership)
    
                        } else {
                            $('#cload').remove();
                            getMissingCommittees( s, tpc_missing, tpc_membership )
                            
                        }
    
                    })
                   
                } // getMissingCommittees( s, tpc_missing, tpc_membership )

                function dispCom(m) {
                    $('.isloading').remove();
                    var cc=0, c_cc=0, p_cc=0;
                    // sort dates
                    for (var j in m) {
                        m[j].dates.sort( function (a,b) { return a.e - b.e });
                        var ed=new Date();
                        var ds=m[j].dates;
                        if (ds[0].e == null) {
                            c_cc++
                        } else {
                            p_cc++
                        }
                        for (var k=0; k<ds.length; k++) {
                            ds[k]['ignore'] = false;
                            if (ds[k].e == ed ) {
                                ds[k]['ignore'] = true;
                            }
                            ed=ds[k].e
                        }
                        cc++;
                        
                    }
                    a_over['commmittees'] = cc;
                    if (cc==0) {
                        $('<p>Not a member of any parliamentary comittees.</p>').appendTo('#Committees');
                        return;
                    } else {
                        $('#comtot').text(cc).addClass('oc');
                    }
                    if (c_cc > 0 ) { dct( m, 'Current committee membership', true ) }
                    if (p_cc > 0 ) { dct( m, 'Previous committee membership', false ) }

                } // dispCom(m)

                function dct( m, h, isc ) {
                    $('<h4>' + h + '</h4>').appendTo('#Committees');
                    var ht='<table class="blueTable">';
                    for (var c in m) {
                        ht+='<tr>';
                        var cUrl = 'https://committees.parliament.uk/committee/' + c.replace('c','') + '/';
                        if (isc) {
                            if (m[c].dates[0].e == null) {
                                ht+='<td style="width:60%;"><a target="_blank" href="' + cUrl + '">' + comList[c]['Name'] + '</a></td>';
                                ht+='<td style="width:20%;">' + comList[c]['CommitteeType'] + '</td>';
                                ht+='<td>Member since ' + $.formatDateTime("d M yy", m[c].dates[0].s)  + '</td>';
                            }
                        } 
                        
                        if (!isc) {
                            if (m[c].dates[0].e !== null) {
                                ht+='<td style="width:60%;"><a target="_blank" href="' + cUrl + '">' + comList[c]['Name'] + '</a></td>';
                                ht+='<td style="width:20%;">' + comList[c]['CommitteeType'] + '</td>';
                                ht+='<td>Member from ' + $.formatDateTime("d M yy", m[c].dates[0].s)  + ' to ' + $.formatDateTime("d M yy", m[c].dates[0].e) + '</td>';
                            }
                        }
                    
                        ht+='</tr>';
                    }
                    ht+="</table>";
                    $(ht).appendTo('#Committees');

                } // 


            }); // end when condition


        } // get_showCommittees()
                                        
        function rt( tc, tcl) {  // build tables of current and previous roles 
            var t='<h3>' + tcl + '</h3>'
            var HasNoCRole = true, HasNoPRole = true;
            var tabc = '<h4>Current</h4><table class="blueTable">'
            var tabp = '<h4>Previous</h4><table class="blueTable">'
            if (tc!==null) {
                for (var k=0; k<tc.length; k++) {
                    if (tc[k]['EndDate']==null) {
                        HasNoCRole = false;
                        tabc+='<tr><td style="width:70%;">'+tc[k]['Name'] + '</td><td>Since ' + $.formatDateTime("d M yy", new Date(tc[k]['StartDate']))
                        tabc+='</td></tr>'
                        a_over.roles[tcl].c++;
                        
                    } 

                    if (tc[k]['EndDate']!==null) {
                        HasNoPRole = false;
                        tabp+='<tr><td style="width:70%;">'+tc[k]['Name'] + '</td><td>From ' + $.formatDateTime("d M yy", new Date(tc[k]['StartDate'])) + ' to ' + $.formatDateTime("d M yy", new Date(tc[k]['EndDate']));
                        tabc+='</td></tr>'
                        a_over.roles[tcl].p++;
                        
                    }
                }
                tabc+='</table>';
                tabp+='</table>';
                
            }
            if (HasNoCRole && HasNoPRole) { 
                t += '<p>No current or previous ' + tcl + '</p>';
            }  else {
                if (HasNoCRole) {
                    t += '<p>No current ' + tcl + '</p>';
                } else {
                    t+=tabc;
                }
                if (HasNoPRole) {
                    t += '<p>No previous ' + tcl + '</p>';
                } else {
                    t+=tabp;
                }
            }                    
            return t

        } // rt

        
        function getQuestions( tmid, inHouse) {
            $('<span class="isloading">Loading</span>').appendTo('#Questions');
            $('<span class="isloading">Loading</span>').appendTo('#Interests');
            var wqUrl = 'https://writtenquestions-api.parliament.uk/api/writtenquestions/questions?askingMemberId='+tmid + '&take=500';
            var wsUrl = 'https://writtenquestions-api.parliament.uk/api/writtenstatements/statements?members=' +tmid + '&take=500';
            var riUrl = 'https://members-api.parliament.uk/api/Members/' + tmid + '/RegisteredInterests'

            var r_wq = setAjax( wqUrl )
            var r_ws= setAjax( wsUrl );
            var r_ri= setAjax( riUrl );
            
            if (inHouse == 'Commons') {
                var oqUrl = 'https://lda.data.parliament.uk/commonsoralquestions.json?_view=Commons+Oral+Questions&_pageSize=500&mnisId=' + tmid;
                var r_oq = $.getJSON( oqUrl, function( data ) {
                    console.log( data );
                })
                $.when( r_wq, r_ws, r_oq, r_ri ).done(function ( d_wq, d_ws, d_oq, d_ri  ) {
                    procQData( d_wq, d_ws, d_oq, d_ri  )
                });
            }
            if (inHouse == 'Lords') {
                var oqUrl=null;
                $.when( r_wq, r_ws, r_ri ).done(function ( d_wq, d_ws, d_ri  ) {
                    procQData( d_wq, d_ws, null, d_ri  )
                });

            }
        } // getQuestions( tmid, inHouse)

        function procQData( d_wq, d_ws, d_oq, d_ri  ) {
            var ht='';
            var tres=0;
            cntQ=0;
            cntS=0;
            var cnt_i=0;

            // process registered interests
            var ti=d_ri[0].value;
            a_over.registeredInterests=0;
            if (ti.length == 0) {
                var nr= '<p>No data on registered interests found via the API'
                nr+='. For MPs, please check the <a target="_blank" href="https://publications.parliament.uk/pa/cm/cmregmem/contents1921.htm">Register of Members Financial Interests - 2019 Parliament</a></p>'
                $(nr).appendTo('#Interests');
            } else {
                var ht='<table id="rInterests" class="display compact"><thead>';
                ht+= '<th>Interest category</th>'
                ht+= '<th>Interest</th>'
                ht+= '<th>Date last amended</th>'
                //ht+= '<th>Date deleted</td></th>'
                ht+= '</thead><tbody>';
                for (var i=0; i<ti.length; i++) {
                    
                    for (var j=0; j<ti[i]['interests']['length']; j++) {
                        ht+='<tr>';
                        ht+= '<td>' + ti[i].name + '</td>';
                        ht+= '<td>' + ti[i]['interests'][j]['interest'] + '</td>';
                        ht+= '<td>' +  $.formatDateTime("d M yy", new Date( ti[i]['interests'][j]['lastAmendedWhen'])) + '</td>';
                        ht+='</tr>';
                        cnt_i++;

                    }

                }
                a_over.registeredInterests=cnt_i;
                ht+= '</tbody>'
                ht+= '</table>'
                $(ht).appendTo('#Interests');
                $('#rInterests').dataTable({
                    "scrollY":        "400px",
                    "scrollCollapse": true,
                    "paging":         false,
                rowGroup: {
                    dataSrc: 0
                },
                "columnDefs": [
                    {
                        "targets": [ 0 ],
                        "visible": false
                    }]
                } );
            }
            var ht='';
            
            if (d_wq[0].totalResults == 0) {
                ht+='<h4>Written Questions</h4><p>No written questions.<p>';   
            } else {
                tres+=d_wq[0].totalResults;
                cntQ+=d_wq[0].totalResults;
                a_over.qands.w=d_wq[0].totalResults;
            }

            if (d_ws[0].totalResults == 0) {
                ht+='<h4>Written Ministerial Statements</h4><p>No written statements.<p>';
            } else {
                tres+=d_ws[0].totalResults;
                cntS+=d_ws[0].results.length;
                a_over.qands.s=d_ws[0].totalResults;
            }
            if (d_oq==null) {
                ht+='<h4>Oral Questions</h4><p>No oral questions.</p>';
            } else {
                tres+=d_oq[2].responseJSON.result.items.length;
                cntQ+=d_oq[2].responseJSON.result.items.length;
                a_over.qands.o=d_oq[2].responseJSON.result.items.length;
            }
            var wq_out = trimQs( d_wq[0].results, inHouse, "Written");
            var ws_out = trimQs( d_ws[0].results, inHouse, "WMS");
            
            var oq_out = null;
            if (d_oq !== null) { oq_out = trimQs( d_oq[2].responseJSON.result.items, inHouse, "Oral");                        }
            
            if (tres>0) {
                drawQuestions( wq_out, ws_out, oq_out, ht )
            }
            
            drawOverview();
        }

        function drawOverview() {
            $('.isloading').remove();
            var tc;
            var ht='<a id="l_ri"></a><table class="blueTable">'
            ht+='<tr>';
            ht+='<td class="oblock" colspan="2">Registered interests</td>'
            ht+='<td class="oblock" colspan="2">Committee membership</td>'
            ht+='<td class="oblock" colspan="3">Statements and questions</td>'
            ht+='<td class="oblock" colspan="4">Roles</td>'
            ht+='</tr>';
            ht+='<tr>';
            ht+='<td rowspan="3">Number of Registered interests</td>'
            if (a_over.registeredInterests == 0) {tc="oczero" } else { tc="oc"};
            ht+='<td rowspan="3" class="' + tc + '">' + a_over.registeredInterests + '</td>';
            // committee membership
            ht+='<td rowspan="3"><a href="#l_committees">Number of Committees</a></td>'
            if (a_over.commmittees == 0) {tc="oczero" } else { tc="oc"};
            ht+='<td rowspan="3" class="' + tc + '"><div id="comtot">' + a_over.commmittees + '</div></td>';

            // written questions
            ht+='<td rowspan="2"><a href="#l_qands">Number of Questions asked</a></td>';
            ht+='<td>Written</td>';
            if (a_over.qands.w == 0) {tc="oczero" } else { tc="oc"};
            ht+='<td class="' + tc + '">' + a_over.qands.w + '</td>';

            // government roles
            ht+='<td rowspan="3"><a href="#l_roles">Number of Roles</a></td>';
            ht+='<td>Government</td>';
            ht+='<td>Current<br>Previous</td>';
            if (a_over.roles.Government.c == 0 && a_over.roles.Government.p == 0 ) {tc="oczero" } else { tc="oc"};
            ht+='<td class="' + tc + '">' + a_over.roles.Government.c + '<br>' +  a_over.roles.Government.p + '</td>';
            ht+='</tr>';
            ht+='<tr>';

            // oral questions
            ht+='<td>Oral</td>';
            if (a_over.qands.o == 0) {tc="oczero" } else { tc="oc"};
            ht+='<td class="' + tc + '">' + a_over.qands.o + '</td>';

            // opposition roles
            ht+='<td>Opposition</td>';
            ht+='<td>Current<br>Previous</td>';
            if (a_over.roles.Opposition.c == 0 && a_over.roles.Opposition.p == 0 ) {tc="oczero" } else { tc="oc"};
            ht+='<td class="' + tc + '">' + a_over.roles.Opposition.c + '<br>' +  a_over.roles.Opposition.p + '</td>';
            ht+='</tr>';
            ht+='<tr>';

            // written ministerial statements
            ht+='<td colspan="2">Written Ministerial statements</td>';
            if (a_over.qands.s == 0) {tc="oczero" } else { tc="oc"};
            ht+='<td class="' + tc + '">' + a_over.qands.s + '</td>'; 
            
            // parliamentary roles
            ht+='<td>Parliamentary</td>';
            ht+='<td>Current<br>Previous</td>';
            if (a_over.roles.Parliamentary.c == 0) {tc="oczero" } else { tc="oc"};
            ht+='<td class="' + tc + '">' + a_over.roles.Parliamentary.c + '<br>' +  a_over.roles.Parliamentary.p + '</td>';
            ht+='</tr>';
            ht+='</table>';
            $(ht).appendTo('#Overview');
            $('#l_top').focus();
            window.scrollTo(0, 0);
        } // drawOverview();

        function drawQuestions( wq_in, ws_in, oq_in, htp ) {
            
            drawQChart(wq_in, ws_in, oq_in);
            // written ministerial statements
            if (ws_in.length > 0) {
                ws_in.sort( function (a,b) { return b.tabled - a.tabled });
                var ht='<h4>Written Ministerial Statements</h4><table id="mStatements" class="display compact"><thead>';
                ht+= '<th>Answering body</th>'
                ht+= '<th>Ministerial role</th>'
                ht+= '<th>Statement title and text</th>'
                ht+= '<th>Tabled on</td></th>'
                ht+= '</thead><tbody>'
                for (var i=0; i<ws_in.length; i++) {
                    ht+= '<tr>'
                    ht+= '<td>' + ws_in[i]['ansBody'] + '</td>';
                    ht+= '<td>' + ws_in[i]['tabling_member'] + '</td>';
                    ht+= '<td>' + ws_in[i]['title'] + '</br>' + ws_in[i]['text'] + '</td>';
                    ht+= '<td>' + $.formatDateTime("d M yy", ws_in[i]['tabled']) + '</td>';
                    ht+= '</tr>'
                }
                ht+= '</tbody>'
                ht+= '</table>'
            }
            $(ht).appendTo('#Questions');
            $('#mStatements').dataTable({
                "scrollY":        "400px",
                "scrollCollapse": true,
                "paging":         false,
                rowGroup: {
                    dataSrc: 0
                },
                "columnDefs": [
                    {
                        "targets": [ 0 ],
                        "visible": false
                    }]
            } );

            $(htp).appendTo('#Questions');

            if (oq_in !== null) {
                wq_in=wq_in.concat(oq_in);
            }
            
            wq_in.sort( function (a,b) { return b.tabled - a.tabled });
            var ht='<h4>Written and oral questions</h4><table id="mQuestions" class="display compact"><thead>';
            ht+= '<th>Answering body</th>'
            ht+= '<th>W or O</th>'
            ht+= '<th>Question text</th>'
            ht+= '<th>Tabled on</td></th>'
            ht+= '</thead><tbody>'
            
            for (var i=0; i<wq_in.length; i++) {
                ht+= '<tr>'
                ht+= '<td>' + wq_in[i]['ansBody'] + '</td>';
                if (wq_in[i]['qclass'] == 'Written') {
                    var scol = '<div style="background-color: grey; color: white; width: 20px;">W</div>';
                } else {
                    var scol = '<div style="background-color: teal; color: white; width: 20px;">O</div>';
                }
                ht+= '<td>' + scol + '</td>';
                ht+= '<td>';
                ht+= wq_in[i]['text']
                var anst='';
                if (typeof wq_in[i]['answerText'] !== 'undefined'  && wq_in[i]['answerText'] !== null) {
                    var anst='<div class="zoomin"><img src="zoom-in.jpg" alt="show/hide answer to question"/>Click to show the answer to this question</div>';
                    anst+= '<div class="qans">' + wq_in[i]['answerText'] + '<br><i>' + 'Answered on ' + $.formatDateTime("d M yy", wq_in[i]['answered']) +'</i></div>';
                }
                ht+=anst;
                ht+='</td>';
                ht+= '<td>' + $.formatDateTime("d M yy", wq_in[i]['tabled']) + '</td>';
                ht+= '</tr>'
            }
            ht+= '</tbody>'
            ht+= '</table>'
            $(ht).appendTo('#Questions');
            $('#mQuestions').dataTable({
                "scrollY":        "400px",
                "scrollCollapse": true,
                "paging":         false,
                rowGroup: {
                    dataSrc: 0
                },
                "columnDefs": [
                    {
                        "targets": [ 0 ],
                        "visible": false
                    }]
            } );
            $('.qans').toggle();
            $('.zoomin').click( function () { $(this).closest('div').next('.qans').toggle(); });
        }

        function trimQs( a_in, inHouse, qclass) {
            var a_out=[];
            for (var i=0; i<a_in.length; i++) {

                var rout = {
                    status: null,
                    text: null,
                    tabled: null,
                    ansBody: null,
                    tabling_member: null,
                    qclass: qclass,
                    inHouse: inHouse,
                    uin: null,
                    answered: null,
                    answerText: null
                }
                
                if (qclass=='WMS') { // Written ministerial statements
                    rout.text=a_in[i].value.text;
                    rout.title=a_in[i].value.title;
                    rout.tabled=new Date( a_in[i].value.dateMade );
                    rout.ansBody=a_in[i].value.answeringBodyName;
                    rout.tabling_member=a_in[i].value.memberRole;
                    rout.noticeNumber=a_in[i].value.noticeNumber;
                    rout.uin= a_in[i].value.uin;
                    if (a_in[i].value.dateAnswered !== null) {
                        rout.answered=new Date( a_in[i].value.dateAnswered )
                        rout.answerText=a_in[i].value.answerText
                    }
                }
                if (qclass=='Written') {                         // Written questions
                    rout.text=a_in[i].value.questionText;
                    rout.tabled=new Date( a_in[i].value.dateTabled );
                    rout.ansBody=a_in[i].value.answeringBodyName;
                    rout.tabling_member=a_in[i].value.askingMemberId;
                    rout.uin= a_in[i].value.uin;
                    if (a_in[i].value.dateAnswered !== null) {
                        rout.answered=new Date( a_in[i].value.dateAnswered )
                        rout.answerText=a_in[i].value.answerText
                    }
                }
                if (qclass=='Oral') { // Oral questions
                    rout.text=a_in[i].questionText + ' <i>' + a_in[i].QuestionStatus._value + '</i>';
                    rout.status=a_in[i].QuestionStatus._value;
                    rout.tabled=new Date( a_in[i].dateTabled._value );
                    rout.ansBody = a_in[i].AnsweringBody[0]._value;
                    rout.tabling_member=a_in[i].tablingMemberPrinted[0]._value;
                    rout.uin= a_in[i].uin;
                    if (a_in[i].AnswerDate._value !== null) {
                        rout.answered=new Date( a_in[i].AnswerDate._value )
                        //rout.answerText=a_in[i].value.answerText
                    }
                }
                a_out.push( rout );
            }
            return a_out;

        } // trimQs( a_in, inHouse, cclass)

        function  drawQChart(wq_in, ws_in, oq_in ) {
        
            var wqc=wq_in.length
            if ( typeof(oq_in) == 'object' && oq_in !== null) {  // combine written and oral questions into a single array
                wq_in=wq_in.concat( oq_in );
            }
            var cs=prepCData ( wq_in, ['#d53e4f','#fc8d59','#fee08b','#ffffbf','#e6f598','#99d594','#3288bd'] );
            var cs_ws = prepCData ( ws_in, ['#edf8fb','#bfd3e6','#9ebcda','#8c96c6','#8c6bb1','#88419d','#6e016b'] );
            cs=cs.concat(cs_ws);
            var ct='';
            var hasQ = false;
            if (wq_in.length>0 && oq_in !== null) {
                ct+= 'Written (' + wqc + ') and Oral (' + oq_in.length + ') questions'
                    hasQ=true;
            } else {
                if (wq_in.length>0) {
                    ct+= 'Written questions (' + wqc + ')'
                    hasQ=true;
                }
                if (oq_in !== null) {
                    if (hasQ) {
                        ct+=', '
                    }
                    ct+= 'Oral questions (' + oq_in.length + ') '
                    hasQ=true;
                }
            }
            if (ws_in.length>0) {
                if (hasQ) {
                    ct += ' and '
                }
                ct+= 'Ministerial statements (' + ws_in.length + ')'
            }


            Highcharts.chart('qChart', {
                chart: {
                    type: 'column',
                    zoomType: 'x'
                },
                legend: { enabled: false},
                credits: {enabled: false},
                title: {  text: ct },
                subtitle: {text: 'by answering body' },
                xAxis: {
                    type: 'datetime',
                    dateTimeLabelFormats: { 
                        //month: '%e. %b %Y',
                        year: '%Y'
                    },
                    title: { text: 'Date'},
                    labels: { format: '{value:%b-%Y}' }
                },
                yAxis: {
                    title: {text: 'No of questions'
                    },
                    min: 0
                },
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br>',
                    pointFormat: '{point.x: %b %Y}: {point.y} questions'
                },
                plotOptions: {
                    column: {
                        stacking: 'normal',
                        dataLabels: {
                            enabled: false
                        }
                    },
                    series: {pointWidth: 15 }
                },
                series: cs,
                responsive: {
                    rules: [{
                        condition: {
                            maxWidth: 500
                        },
                        chartOptions: {
                            plotOptions: {
                                series: {
                                    marker: {
                                        radius: 2.5
                                    }
                                }
                            }
                        }
                    }]
                }
            });
            $('#ccdesc').text('Where data is available, the chart above shows numbers of written and oral questions asked, and (in purple) the 20 most recent Written Ministerial Statements. Click and drag in the chart to zoom in and inspect the data.  See tables below for lists of questions asked and statements made.')
        } // drawQChart(wq_in, ws_in) 


        function prepCData ( wq_in, cr ) {

            var cs=[], spos=null;
            for (var i=0; i<wq_in.length; i++) {
                var tDept=wq_in[i].ansBody;
                var hasNoSeries=true;
                for (var j=0; j<cs.length; j++) {
                    if (cs[j].name == tDept) {hasNoSeries=false, spos=j}
                }
                if (hasNoSeries) {
                    cs.push({name: tDept, data: [], data_in: []});
                    spos=cs.length-1;
                }
                var tDate = wq_in[i].tabled;
                var tod=Date.UTC( tDate.getUTCFullYear(), tDate.getUTCMonth(), 1 ) // aggregate by year and month only
                var t_tod='d'+tod;
                
                if (typeof( cs[spos]['data_in'][t_tod] ) == 'undefined') {
                    cs[spos]['data_in'][t_tod] = 1;
                } else {
                    cs[spos]['data_in'][t_tod]++; 
                }
            }

            var cRange=chroma.scale(cr).colors(cs.length);

            // POPULATE data arrays
            for (var i=0; i<cs.length; i++) {
                cs[i].color = cRange[i];
                var td=cs[i]['data_in'] 
                for (var j in td) {
                    var tn=parseInt( j.substring(1, j.length))
                    var ta=[tn,td[j] ]
                    cs[i]['data'].push(ta); 
                }
            }
            return cs;
        } // prepCData ( wq_in, cr )


        function cd( tdate ) {
            var rd=new Date(tdate)
            if (typeof(tdate) == 'object') {
                var rd=null
            }
            return rd;
        }

    } // showDetails(tpid)
    function getRndInteger(min, max) {
        return Math.floor(Math.random() * (max - min) ) + min;
    }

    function setAjax( url ) {
        //if (url==null) {return null};
        var settings = {
            'cache': false,
            'dataType': "json",
            "async": true
            //,"crossDomain": true,
            ,"url": url,
            "method": "GET",
            "headers": {
                "accept": "application/json"
                //,"Access-Control-Allow-Origin":"*"
            }
        }

        var request = $.ajax(settings).done(
            function (response) { 
                console.log(response);
            }
        ).fail( function(xhr) {
            var errorMessage = xhr.status + ': ' + xhr.statusText
            alert(errorMessage + '- please try again later');
            return;
        });

        return request;
    } // setAjax( url )
} // drawViz();
