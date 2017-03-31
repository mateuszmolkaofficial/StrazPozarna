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

//UPLOAD 1st PART WHICH LAUNCHES onReaderLoad() FUNCTION
//AND CHECKS WHEATHER FILES WAS .JSON
function onUpload(){
    
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

//FUNCTION WHICH IS EXECUTED AFTER UPLOADING A FILE
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
                unreachableCities: []
            }
            
            //ASSIGNING VALUES OF CITY NAME AND IF THE CITY HAS A FIRE BRIGADE
            city.name=obj.nazwa;
            city.hasFirebrigade=obj.ma_jednostke;
            
            if(!city.hasFirebrigade){
                citiesWithoutFirebrigade.push(city.name);
            }
            //MAIN PROCESSING ALGORITHM
            if(city.hasFirebrigade){
                mainDataGlobal.drogi.forEach(function(obj){
                    if(city.name==obj.miasta[0] || city.name==obj.miasta[1]){
                        if(maxTimeGlobal>=obj.czas_przejazdu){
                            
                            //VARIABLE TO BE ADD TO THE CITY JSON OBJECT
                            //UNDER THE FIELD REACHABLE OR UNREACHABLE CITY
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
                            city.reachableCities.forEach(function(obj){
                                if(obj.name==temporaryCityParameter.name){
                                    isCityUnique=false;
                                }
                            })
                            if(isCityUnique){
                                city.reachableCities.push(temporaryCityParameter);
                            }
                        }else{
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
                            city.unreachableCities.forEach(function(obj){
                                if(obj.name==temporaryCityParameter.name){
                                    isCityUnique=false;
                                }
                            })
                            if(isCityUnique){
                                city.unreachableCities.push(temporaryCityParameter);
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
        
        //DISPLAY THE CITIES REPORT
        
        //DISPLAY BLACK LIST
        if(blackList.length==0){
            $('#black-list-header').after("<div class=\"black-list-positive\"><p>Good news! Every city, even without fire brigade is save, travel time from other cities is smaller than critical time!</p></div>" );
        }else{
            $('#black-list-header').after("<div class=\"black-list-negative\"><p>Bad news! There cities have no fire brigade and maximum time exceeds travel time from another cities:</p></div>" );
            blackList.forEach(function(obj){
                 $('.black-list-negative').append("<p>"+obj+"</p>\n");
            })
        }
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
})