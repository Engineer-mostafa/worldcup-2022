CREATE TYPE UserGender AS ENUM ('male','female');
CREATE TYPE UserRole   AS ENUM ('manager','fan','unapprovedManager');
CREATE TYPE UserNational AS ENUM ('Afghan'                    ,'Albanian'               ,'Algerian'              ,'American'      ,'Andorran','Angolan','Antiguans and Barbudan','Argentine','Armenian','Aruban',
                                  'Australian'                ,'Austrian'               ,'Azerbaijani'           ,'Bahamian'      ,'Bahraini','Bangladeshi','Barbadian','Basque','Belarusian','Belgian',
                                  'Belizean'                  ,'Beninese'               ,'Bermudian'             ,'Bhutanese'     ,'Bolivian','Bosniak','Bosnians and Herzegovinian','Botswana','Brazilian','Breton',
                                  'British'                   ,'British Virgin Islander','Bruneian'              ,'Bulgarian'     ,'Macedonian Bulgarian','Burkinabé','Burmese','Burundian','Cambodian','Cameroonian',
                                  'Canadian'                  ,'Catalan'                ,'Cape Verdean'          ,'Caymanian'     ,'Chaldean','Chadian','Chilean','Chinese','Colombian','Comorian',
                                  'Congolese (DRC)'           ,'Congolese (RotC)'       ,'Costa Rican'           ,'Croat'         ,'Cuban','Cypriot','Czech','Dane','Greenlander','Djiboutian',
                                  'Dominicans (Commonwealth)' ,'Dominicans (Republic)'  ,'Dutch'                 ,'East Timorese' ,'Ecuadorian','Egyptian','Emirati','English','Equatoguinean','Eritrean',
                                  'Estonian'                  ,'Ethiopian'              ,'Falkland Islander'     ,'Faroese'       ,'Fijian','Finn','Finnish Swedish','Filipino','French citizen','Gabonese',
                                  'Gambian'                   ,'Georgian'               ,'German'                ,'Baltic German' ,'Ghanaian','Gibraltarian','Greek','Greek Macedonian','Grenadian','Guatemalan',
                                  'Guianese (French)'         ,'Guinean'                ,'Guinea-Bissau national','Guyanese'      ,'Haitian','Honduran','Hong Konger','Hungarian','Icelander','I-Kiribati',
                                  'Indian'                    ,'Indonesian'             ,'Iranian'               ,'Iraqi'         ,'Irish','Israeli','Italian','Ivoirian','Jamaican','Japanese',
                                  'Jordanian'                 ,'Kazakh'                 ,'Kenyan'                ,'Korean'        ,'Kosovar','Kuwaiti','Kyrgyz','Lao','Latvian','Lebanese',
                                  'Liberian'                  ,'Libyan'                 ,'Liechtensteiner'       ,'Lithuanian'    ,'Luxembourger','Macao','Macedonian','Malagasy','Malawian','Malaysian',
                                  'Maldivian'                 ,'Malian'                 ,'Maltese'               ,'Manx'          ,'Marshallese','Mauritanian','Mauritian','Mexican','Micronesian','Moldovan',
                                  'Monégasque'                ,'Mongolian'              ,'Montenegrin'           ,'Moroccan'      ,'Mozambican','Namibian','Nauruan','Nepalese','New Zealander','Nicaraguan',
                                  'Nigerien'                  ,'Nigerian'               ,'Norwegian'             ,'Omani'         ,'Pakistani','Palauan','Palestinian','Panamanian','Papua New Guinean','Paraguayan',
                                  'Peruvian'                  ,'Pole'                   ,'Portuguese'            ,'Puerto Rican'  ,'Qatari','Quebecer','Réunionnai','Romanian','Russian','Baltic Russian',
                                  'Rwandan'                   ,'Saint Kitts and Nevi'   ,'Saint Lucian'          ,'Salvadoran'    ,'Sammarinese','Samoan','São Tomé and Príncipe','Saudi','Scot','Senegalese',
                                  'Serb'                      ,'Seychelloi'             ,'Sierra Leonean'        ,'Singaporean'   ,'Slovak','Slovene','Solomon Islander','Somali','Somalilander','Sotho',
                                  'South African'             ,'Spaniard'               ,'Sri Lankan'            ,'Sudanese'      ,'Surinamese','Swazi','Swede','Swis','Syriac','Syrian',
                                  'Taiwanese'                 ,'Tamil'                  ,'Tajik'                 ,'Tanzanian'     ,'Thai','Tibetan','Tobagonian','Togolese','Tongan','Trinidadian',
                                  'Tunisian'                  ,'Turk'                   ,'Tuvaluan'              ,'Ugandan'       ,'Ukrainian','Uruguayan','Uzbek','Vanuatuan','Venezuelan','Vietnamese')


CREATE TABLE "Users"(
    "id"          BIGSERIAL    NOT NULL,
    "username"    TEXT         NOT NULL,
    "password"    TEXT         NOT NULL,
    "firstname"   TEXT         NOT NULL,
    "lastname"    TEXT         NOT NULL,
    "birthdate"   DATE         NOT NULL,
    "gender"      UserGender   NOT NULL,
    "nationality" UserNational NULL,
    "email"       TEXT         NOT NULL,
    "role"        UserRole     NOT NULL
);
ALTER TABLE
    "Users" ADD PRIMARY KEY("id");

CREATE TABLE "Teams"(
    "id"   BIGSERIAL NOT NULL,
    "team" TEXT      NOT NULL
);
ALTER TABLE
    "Teams" ADD PRIMARY KEY("id");

CREATE TABLE "Stadiums"(
    "id"       BIGSERIAL NOT NULL,
    "name"     TEXT      NOT NULL,
    "length"   INTEGER   NOT NULL,
    "width"    INTEGER   NOT NULL,
    "location" TEXT      NULL
);
ALTER TABLE
    "Stadiums" ADD PRIMARY KEY("id");

CREATE TABLE "Matches"(
    "id"        BIGSERIAL NOT NULL,
    "team1"     BIGSERIAL NOT NULL,
    "team2"     BIGSERIAL NOT NULL,
    "stadium"   BIGSERIAL NOT NULL,
    "date"      DATE      NOT NULL,
    "time"      TIME(0)   WITHOUT TIME ZONE 
                          NOT NULL,
    "mainref"   TEXT      NOT NULL,
    "linesman1" TEXT      NOT NULL,
    "linesman2" TEXT      NOT NULL
);
ALTER TABLE
    "Matches" ADD PRIMARY KEY("id");

CREATE TABLE "Reservations"(
    "reservationnum" BIGINT    NOT NULL,
    "user"           BIGSERIAL NOT NULL,
    "match"          BIGSERIAL NOT NULL,
    "row"            INTEGER   NOT NULL,
    "seat"           INTEGER   NOT NULL,
    PRIMARY KEY ("user","match")
);
ALTER TABLE
    "Reservations" ADD CONSTRAINT "reservations_reservationnum_unique" UNIQUE("reservationnum");


ALTER TABLE
    "Matches" ADD CONSTRAINT "matches_team1_foreign" FOREIGN KEY("team1") REFERENCES "Teams"("id");
ALTER TABLE
    "Matches" ADD CONSTRAINT "matches_team2_foreign" FOREIGN KEY("team2") REFERENCES "Teams"("id");
ALTER TABLE
    "Matches" ADD CONSTRAINT "matches_stadium_foreign" FOREIGN KEY("stadium") REFERENCES "Stadiums"("id");

ALTER TABLE
    "Reservations" ADD CONSTRAINT "reservations_user_foreign" FOREIGN KEY("user") REFERENCES "Users"("id");
ALTER TABLE
    "Reservations" ADD CONSTRAINT "reservations_match_foreign" FOREIGN KEY("match") REFERENCES "Matches"("id");
    
ALTER TABLE
    "Users" ADD CONSTRAINT users_username_un UNIQUE (username);
