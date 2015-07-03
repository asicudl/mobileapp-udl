angular.module('starter.agendaevents', [])
.service('AgendaEventsService',[function (){
 
    this.getEvents = function (){
        var genericDescription = 'Lorem Ipsum és un text de farciment usat per la indústria de la tipografia i la impremta. Lorem Ipsum ha estat el text estàndard de la indústria des de l\'any 1500, quan un impressor desconegut va fer servir una galerada de text i la va mesclar per crear un llibre de mostres tipogràfiques. No només ha sobreviscut cinc segles, sinó que ha fet el salt cap a la creació de tipus de lletra electrònics, romanent essencialment sense canvis. Es va popularitzar l\'any 1960 amb el llançament de fulls Letraset que contenien passatges de Lorem Ipsum, i més recentment amb programari d\'autoedició com Aldus Pagemaker que inclou versions de Lorem Ipsum.';
        
        
        var items = [{ imgSrc: 'modules/customBuildService/agendaMockup/img/event1.jpg', title: 'La UdL lider en recerca biomèdica', id: '1', description: genericDescription, date: '28 Feb 2015' },
                {imgSrc: 'modules/customBuildService/agendaMockup/img/event2.jpg',  title: 'Acte d\'entrega de premis al millor', id: '2', description: genericDescription,  date: '14 Feb 2015' },
                {imgSrc: 'modules/customBuildService/agendaMockup/img/event3.jpg', title: 'Una noticia molt important', id: '3', description: genericDescription,  date: '3 Gen 2015'},
                {imgSrc: 'modules/customBuildService/agendaMockup/img/event4.jpg', title: 'totes les coses van com a sempre', id: '4', description: genericDescription ,  date: '1 Gen 2015'},
                {imgSrc: 'modules/customBuildService/agendaMockup/img/event5.jpg', title: 'Les altres noticies també en portada', id: '5', description: genericDescription,  date: '3 Dec 2014' },
                {imgSrc: 'modules/customBuildService/agendaMockup/img/event6.jpg', title: 'La Udl millora les collites amb noves tècniques', id: '6', description: genericDescription , date: '3 Nov 2014'  }];
        return items;
    };
    
    this.getAgendaItems = function (){
        
        var genericDescription = 'Lorem Ipsum és un text de farciment usat per la indústria de la tipografia i la impremta. Lorem Ipsum ha estat el text estàndard de la indústria des de l\'any 1500, quan un impressor desconegut va fer servir una galerada de text i la va mesclar per crear un llibre de mostres tipogràfiques. No només ha sobreviscut cinc segles, sinó que ha fet el salt cap a la creació de tipus de lletra electrònics, romanent essencialment sense canvis. Es va popularitzar l\'any 1960 amb el llançament de fulls Letraset que contenien passatges de Lorem Ipsum, i més recentment amb programari d\'autoedició com Aldus Pagemaker que inclou versions de Lorem Ipsum.';

        var nowdate = moment();
        var yesterday = moment().subtract(1,'days');
        var lastweek = moment().subtract(1,'weeks');
        
        
        var agendaItems = [{title: 'Congrès de veterinaria', id: '1', description: genericDescription, dayOfWeek: nowdate.format ('dddd'), dayMonth: nowdate.format('D MMM'), hour: nowdate.format('HH:mm'), location: 'Seu vella'},
                           {title: 'Congrès de dddd', id: '2', description: genericDescription, dayOfWeek: yesterday.format ('dddd'), dayMonth: yesterday.format('D MMM'), hour: yesterday.format('HH:mm'), location: 'Sala de juntes'},
                           {title: 'Premis de dddd',  id: '3', description: genericDescription, dayOfWeek: lastweek.format ('dddd'), dayMonth: lastweek.format('D MMM'), hour: lastweek.format ('HH:mm'),location: 'Rectorat - Sala d\'actes'},
                           {title: 'Acampada a la UdL', id: '4', description: genericDescription, dayOfWeek: nowdate.format ('dddd'), dayMonth: nowdate.format('D MMM'), hour: '12:00', location: 'Edifici emblemàtic - 3.10'}
                          ];
        return agendaItems;
    };
    
}]);
