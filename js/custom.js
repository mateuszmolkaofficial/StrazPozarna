'use strict';

//DATA VARIABLE
var mainDataGlobal;
var maxTimeGlobal;
var processedDataGlobal=[];
var citiesWithoutFirebrigade=[];
var blackList=[];

//ADDITIONAL FUNCTION FOR REMOVING ITEM FROM ARRAY BY NAME
function removeA(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}

//MAIN ALGORITHM SUPPORTING FUNCTION
function mainAlgorithmSupport(city,obj,which){
    
    var temporaryCityParameter={
        name:"",
        time:""
    };
    
    if(city.name==obj.miasta[0]){
        temporaryCityParameter.name=obj.miasta[1];
    }else{
        temporaryCityParameter.name=obj.miasta[0];
    }

    temporaryCityParameter.time=obj.czas_przejazdu;
    //Flag Variable to  achieve only one city.
    var isCityUnique=true;
    city[which].forEach(function(objInner){
        if(objInner.name==temporaryCityParameter.name){
            isCityUnique=false;
        }
    })
    return [isCityUnique, temporaryCityParameter];
}
//UPLOAD 1st PART WHICH LAUNCHES onReaderLoad() FUNCTION
//AND CHECKS WHEATHER FILES WAS .JSON
function onUpload(event){
    
        //CREATING THE FileReader
        var reader = new FileReader();
        reader.onload = onReaderLoad;
        reader.readAsText(event.target.files[0]);
        
        //CHECKING FILE EXTENSTION- MUST BE JSON
        var splitName=event.target.files[0].name.split(".");
        var extension=splitName[splitName.length-1].toLowerCase();
    
        //ERROR - WRONG FILE EXTENSION
        if(extension!=="json"){
            $('#data-insert-panel h2').after( "<p>ERROR! <br> ONLY POSSIBLE FORMAT IS \".JSON\". </p>" );
            return -1;
        }
    }

//FUNCTION WHICH IS EXECUTED AFTER UPLOADING A FILE (PROCCESING DATA, DISPLAYING DATA)
function onReaderLoad(event){
    
    //PASSING DATA FROM FILE
    mainDataGlobal = JSON.parse(event.target.result);
    //SETTING THE MAXIMUM TIME
    maxTimeGlobal=mainDataGlobal.max_czas_przejazdu;

    //VALIDATION OF THE DATA- JSON FILE HAS TO HAVE THIS STRUCTURE
    if(mainDataGlobal.miasta && mainDataGlobal.drogi && mainDataGlobal.max_czas_przejazdu){
        
        //FOR EACH CITY PROGRAM CHECKS THE REACHABLE CITIES 
        mainDataGlobal.miasta.forEach(function(obj){
            
            //CITY JSON OBJECT TO MAKE ALGORITHM EASIER
            var city={
                name:"",
                hasFirebrigade: "",
                reachableCities: [],
                unreachableCities: [],
                reachableFrom:[]
            }
            
            //ASSIGNING VALUES OF CITY NAME AND IF THE CITY HAS A FIRE BRIGADE
            city.name=obj.nazwa;
            city.hasFirebrigade=obj.ma_jednostke;
            
            
            //MAIN PROCESSING ALGORITHM
            if(city.hasFirebrigade){
                mainDataGlobal.drogi.forEach(function(obj){
                    if(city.name==obj.miasta[0] || city.name==obj.miasta[1]){
                        if(maxTimeGlobal>=obj.czas_przejazdu){
                            var support= mainAlgorithmSupport(city,obj,"reachableCities");
                            if(support[0]){
                                city.reachableCities.push(support[1]);
                            }
                        }else{
                            var support= mainAlgorithmSupport(city,obj,"unreachableCities");
                            if(support[0]){
                                city.unreachableCities.push(support[1]);
                            }
                        }
                    }
                });
            }else{
               //THE VARIABLE IS USED FOR CREATING BLACK LIST
               citiesWithoutFirebrigade.push(city.name);
                
               mainDataGlobal.drogi.forEach(function(obj){
                    if(city.name==obj.miasta[0] || city.name==obj.miasta[1]){
                        if(maxTimeGlobal>=obj.czas_przejazdu){
                            var support= mainAlgorithmSupport(city,obj,"reachableFrom");
                            if(support[0]){
                                city.reachableFrom.push(support[1]);
                            }
                        }
                    }
                });
            }
            processedDataGlobal.push(city);
        })
        
        
        //BLACK LIST- CITIES THAT CAN'T BE REACHED FROM ANYWHERE
        processedDataGlobal.forEach(function(obj){
                if(obj.hasFirebrigade){
                    obj.reachableCities.forEach(function(obj){
                    removeA(citiesWithoutFirebrigade, obj.name);
                })
                }
        })
        blackList=citiesWithoutFirebrigade;
        
        
        //DATA INSERT PANEL FADE OUT
        $('#data-insert').fadeOut(1000);
        
        
        //--------------------------------------------------------------------
        //DATA DISPLAY SECTION START
        
        //DISPLAY THE CRITICAL TIME ON THE WEB PAGE
        $('#time-span')[0].innerHTML=maxTimeGlobal;
        
         //DISPLAY BLACK LIST
        if(blackList.length==0){
            $('#black-list-header').after("<div class=\"black-list-positive\"><p>Good news! Every city, even without fire brigade is save, travel time from other cities is smaller than critical time!</p></div>" );
        }else{
            $('#black-list-header').after("<div class=\"black-list-negative\"><p>Bad news! These cities have no fire brigade and travel time from another cities exceeds critical time:</p><ul></ul></div>" );
            blackList.forEach(function(obj){
                 $('.black-list-negative ul').append("<li>City \""+obj+"\"</li>\n");
            })
        }
        
        //DISPLAY THE CITIES REPORT
        processedDataGlobal.forEach(function(obj,index){
            var hasFirebrigade;
            var temporaryReachableCities=[];
            var temporaryUnreachableCities=[];
            var temporaryReachableFromCities=[];
            var temporaryCityParameter={
                name:"",
                time:""
            };
            if(obj.hasFirebrigade==true){
                
                //CITY TITLE
                $('.cities-report').append("<div id=\"city-"+obj.name+"\" class=\"positive-check\"><h3>City\""+obj.name+"\"</h3></div>");
                
                //CONFIRMATION THAT CITY IS SAVE
                $('#city-'+obj.name).append("<p><i class=\"fa fa-check fa-2x\" aria-hidden=\"true\"></i>City is save.</p>\n");
                
                //CONFIRMATION THE CITY HAS A FIRE BRIGADE
                $('#city-'+obj.name).append("<p><i class=\"fa fa-fire-extinguisher  fa-2x\" aria-hidden=\"true\"></i>City has a fire brigade</p><hr>\n");
                
                if(obj.reachableCities.length!=0){
                    $('#city-'+obj.name).append("<div id=\"reachable-city-"+(index+1)+"\" class=\"cities-positive\"><p>Reachable cities from city \""+obj.name+"\" are:</p><ul id=\"reachable-city-list"+(index+1)+"\"></ul></div>\n");
                    
                    obj.reachableCities.forEach(function(objInner){
                        $('#reachable-city-list'+(index+1)).append("<li>City \""+objInner.name+"\" in <span>"+objInner.time+"</span> time units</li>");
                    })
                    
                }else{
                    $('#city-'+obj.name).append("<div class=\"cities-negative\"><p>No reachable cities in such short time!</p></div>\n");
                }
            }else{
                if(obj.reachableFrom.length!=0){
                    //CITY TITLE
                    $('.cities-report').append("<div id=\"city-"+obj.name+"\" class=\"positive-check\"><h3>City \""+obj.name+"\"</h3></div>");
                    
                    //CONFIRMATION THAT CITY IS SAVE
                    $('#city-'+obj.name).append("<p><i class=\"fa fa-check fa-2x\" aria-hidden=\"true\"></i>City is save.</p>\n");
                    
                    //CONFIRMATION THE CITY HAS NO FIRE BRIGADE
                    $('#city-'+obj.name).append("<p><i class=\"fa fa-times  fa-2x\" aria-hidden=\"true\"></i>City has no fire brigade</p><hr>\n");
                    
                    $('#city-'+obj.name).append("<div id=\"reachable-from-city-"+(index+1)+"\" class=\"cities-positive\"><p>This city is reachable from cities:</p><ul id=\"reachable-from-city-list"+(index+1)+"\"></ul></div>\n");
                    obj.reachableFrom.forEach(function(objInner){
                        $('#reachable-from-city-list'+(index+1)).append("<li>From city \""+objInner.name+"\" in <span>"+objInner.time+"</span> time units</li>");
                    })
                    
                }else{
                    
                    //CITY TITLE
                    $('.cities-report').append("<div id=\"city-"+obj.name+"\" class=\"negative-check\"><h3>City \""+obj.name+"\"</h3></div>");
                    
                    //CONFIRMATION THAT CITY IS NOT SAVE
                    $('#city-'+obj.name).append("<p><i class=\"fa fa-times fa-2x\" aria-hidden=\"true\"></i>City is not save.</p>\n");
                    
                    //CONFIRMATION THE CITY HAS NO FIRE BRIGADE
                    $('#city-'+obj.name).append("<p><i class=\"fa fa-times  fa-2x\" aria-hidden=\"true\"></i>City has no fire brigade</p><hr>\n");
                    
                    $('#city-'+obj.name).append("<div id=\"reachable-from-city-"+(index+1)+"\" class=\"cities-negative\"><p>DANGER! City is not reachable from anywhere in such short time!</p></div>\n");
                }
            }
            
            $('.cities-report').append("<hr>\n");
        })
        
        //DATA DISPLAY SECTION END
        //--------------------------------------------------------------------
        
    }else{
         //ERROR - WRONG FORMAT
         $('#data-insert-panel h2').after( "<p>ERROR! <br>YOUR FILE HAS BAD FORMAT. <br>CHECK OUT EXAMPLE FILE \"data.json\" </p>" );
    }
       
}

//MAIN DOCUMENT
$(function(){
    $('#file').change(onUpload);
    $('#new-data-button').click(function(){
        location.reload();
        $('#file').val("");
        processedDataGlobal=[];
        $('#data-insert').fadeIn(1000);
    });
})