angular.module('starter.agendaevents')
    .factory('ActivityService',function (){

    return {
        
        
        getEvents :function (){
            var genericDescription = 'Lorem Ipsum és un text de farciment usat per la indústria de la tipografia i la impremta. Lorem Ipsum ha estat el text estàndard de la indústria des de l\'any 1500, quan un impressor desconegut va fer servir una galerada de text i la va mesclar per crear un llibre de mostres tipogràfiques. No només ha sobreviscut cinc segles, sinó que ha fet el salt cap a la creació de tipus de lletra electrònics, romanent essencialment sense canvis. Es va popularitzar l\'any 1960 amb el llançament de fulls Letraset que contenien passatges de Lorem Ipsum, i més recentment amb programari d\'autoedició com Aldus Pagemaker que inclou versions de Lorem Ipsum.';


            var items = [{ imgSrc: 'modules/customBuildService/agendaMockup/img/event1.jpg', title: 'La UdL lider en recerca biomèdica', id: '1', description: genericDescription, date: '28 Feb 2015' },
                         {imgSrc: 'modules/customBuildService/agendaMockup/img/event2.jpg',  title: 'Acte d\'entrega de premis al millor', id: '2', description: genericDescription,  date: '14 Feb 2015' },
                         {imgSrc: 'modules/customBuildService/agendaMockup/img/event3.jpg', title: 'Una noticia molt important', id: '3', description: genericDescription,  date: '3 Gen 2015'},
                         {imgSrc: 'modules/customBuildService/agendaMockup/img/event4.jpg', title: 'totes les coses van com a sempre', id: '4', description: genericDescription ,  date: '1 Gen 2015'},
                         {imgSrc: 'modules/customBuildService/agendaMockup/img/event5.jpg', title: 'Les altres noticies també en portada', id: '5', description: genericDescription,  date: '3 Dec 2014' },
                         {imgSrc: 'modules/customBuildService/agendaMockup/img/event6.jpg', title: 'La Udl millora les collites amb noves tècniques', id: '6', description: genericDescription , date: '3 Nov 2014'  }];
            return items;
        }
        };
                                
    
    });