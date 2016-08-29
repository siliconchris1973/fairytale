drop table progress;
drop table audiobooks;

create table progress(
  book_id int not null PRIMARY KEY,
  elapsed float not null,
  part int not null
);

create table audiobooks(
  id int not null PRIMARY KEY,
  book_id int not null,
  tag_id char(6) not null,
  pre_tag char(5) not null,
  checksum char(4) not null,
  rawdata char(12) not null,
  abook_title char(255) not null,
  abook_filename char(255) not null,
  abook_picture char(255),
  abook_description char(255)
);

insert into audiobooks (id, book_id, tag_id, pre_tag, checksum, rawdata, abook_title, abook_filename, abook_picture)
VALUES (1,1, '75CB73', '0F00', '0xc2', '0F0075CB73C2', 'The 1st book', '75CB73', '75CB73');

insert into audiobooks (id, book_id, tag_id, pre_tag, checksum, rawdata, abook_title, abook_filename, abook_picture)
VALUES (2,2, '75ED84', '0F00', '0x23', '0F0075EDB423', 'The 2nd book', '75ED84', '75ED84');

insert into audiobooks (id, book_id, tag_id, pre_tag, checksum, rawdata, abook_title, abook_filename, abook_picture)
VALUES (3,3, '318BD5', '0D00', '0x62', '0D00318BD562', 'The 3rd book', '318BD5', '318BD5');

insert into audiobooks (id, book_id, tag_id, pre_tag, checksum, rawdata, abook_title, abook_filename, abook_picture)
VALUES (4,4, '755B24', '0F00', '0x5', '0F00755B2405', 'The 4th book', '755B24', '755B24');

insert into audiobooks (id, book_id, tag_id, pre_tag, checksum, rawdata, abook_title, abook_filename, abook_picture)
VALUES (5,5, '756D1C', '0F00', '0xb', '0F00756D1C0B', 'The 5th book', '756D1C', '756D1C');

insert into audiobooks (id, book_id, tag_id, pre_tag, checksum, rawdata, abook_title, abook_filename, abook_picture)
VALUES (6,6, '759C71', '0F00', '0x97', '0F00759C7197', 'The 6th book', '759C71', '759C71');

insert into audiobooks (id, book_id, tag_id, pre_tag, checksum, rawdata, abook_title, abook_filename, abook_picture)
VALUES (7,7, '780E0F', '0F00', '0x76', '0F00780E0F76', 'The 7th book', '780E0F', '780E0F');

insert into audiobooks (id, book_id, tag_id, pre_tag, checksum, rawdata, abook_title, abook_filename, abook_picture)
VALUES (8,8, '31455D', '0xd00', '0x24', '0D0031455D24', 'The 8th book', '31455D', '31455D');

insert into audiobooks (id, book_id, tag_id, pre_tag, checksum, rawdata, abook_title, abook_filename, abook_picture)
VALUES (9,9, '750309', '0F00', '0x70', '0F0075030970', 'The 9th book', '750309', '750309');

insert into audiobooks (id, book_id, tag_id, pre_tag, checksum, rawdata, abook_title, abook_filename, abook_picture)
VALUES (10,10, '753080', '0F00', '0xca', '0F00753080CA', 'The 10th book', '753080', '753080');


select * from audiobooks;