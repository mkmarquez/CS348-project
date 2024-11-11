from flask import Flask, request, jsonify, g
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, desc, select
from sqlalchemy import bindparam, Index

DATABASE = 'sqlite://///Users/maliamarquez/Desktop/cs348/cs348projectBooks.db'

db = SQLAlchemy()
app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE
db.init_app(app)

class Book(db.Model):
    __tablename__ = 'Books'
    book_id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    author_id = db.Column(db.Integer, db.ForeignKey('Authors.author_id'), index=True)
    genre_id = db.Column(db.Integer, db.ForeignKey('Genres.genre_id'), index=True)

class Author(db.Model):
    __tablename__ = 'Authors'
    author_id = db.Column(db.Integer, primary_key=True)
    author_name = db.Column(db.String(100), index=True)

class User(db.Model):
    __tablename__ = 'Users'
    username = db.Column(db.String(100), primary_key=True, index=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100))
    password = db.Column(db.String(100))

class Genre(db.Model):
    __tablename__ = 'Genres'
    genre_id = db.Column(db.Integer, primary_key=True)
    genre = db.Column(db.String(100), index=True)

class Bookshelf(db.Model):
    __tablename__ = 'Bookshelf'
    username = db.Column(db.String(100), db.ForeignKey('Users.username'), primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey('Books.book_id'), primary_key=True)
    reading_status = db.Column(db.String(100))
    rating = db.Column(db.Integer)

    __table_args__ = (
        db.Index('user_book_idx', 'username', 'book_id'),
        db.Index('user_status_idx', 'username', 'reading_status'),
        db.Index('user_rating_idx', 'username', 'rating')
    )


"""
report struct {
    books: [{title, author, genre, status, rating}],
    top author: [{author name, num books}],
    top genre: [{genre name, num books}],
    avg rating: #
}
"""

@app.route('/login', methods=['POST'])
def login():
    input = request.get_json()
    print(input)
    results = User.query.filter(User.username == input['username'], User.password==input['password']).count()
    if results == 1:
        return jsonify('logged in')
    print("err")
    return jsonify('err')

@app.route('/getallbooks', methods=['GET'])
def getallbooks():
    results = db.session.query(
    Book.title,
    Book.book_id,
    Author.author_name
    )\
    .join(Author, Author.author_id == Book.author_id).all()
    books = []
    for d in results:
        b = {
            'book_id': d.book_id,
            'title': d.title,
            'author_name': d.author_name
        }
        books.append(b)
    return books


@app.route('/getbooks', methods=['POST'])
def getbooks(): # get books for dropdown to update
    input = request.get_json()
 
    results = db.session.query(
    Book.title,
    Book.book_id,
    Author.author_name,
    Bookshelf.reading_status,
    Bookshelf.rating
    ).join(Bookshelf, Book.book_id == Bookshelf.book_id)\
    .join(Author, Author.author_id == Book.author_id)\
    .filter(Bookshelf.username == input).all()
    print(results)
    books = []
    for d in results:
        b = {
            'book_id': d.book_id,
            'title': d.title,
            'author_name': d.author_name,
            'reading_status': d.reading_status,
            'rating': d.rating
        }
        books.append(b)

    return books

@app.route('/getreport', methods=['POST'])
def getreport():
    print("in get report")
    input = request.get_json()

    # report 
    report = {
        'books': [],
        'top_author': [],
        'top_genre': [],
        'avg_rating': 0
    }

    # all books
    books_sql = (
            select(
                Book.title,
                Author.author_name,
                Bookshelf.reading_status,
                Bookshelf.rating
            )
            .select_from(
                Book.__table__
                .join(Bookshelf, Book.book_id == Bookshelf.book_id)
                .join(Author, Author.author_id == Book.author_id)
            )
            .where(Bookshelf.username == bindparam('username'),)
        )

    with db.session() as session:
        results = session.execute(books_sql, {'username': input}).all()

    books = []
    for d in results:
        b = {
            'title': d.title,
            'author_name': d.author_name,
            'reading_status': d.reading_status,
            'rating': d.rating
        }
        books.append(b)

    report['books'] = books

    # top author
    author_count = (
        select(Author.author_name,func.count(Bookshelf.book_id).label('author_count'))
        .join(Book, Book.author_id == Author.author_id)
        .join(Bookshelf, Book.book_id == Bookshelf.book_id)
        .where(Bookshelf.reading_status == 'Read',Bookshelf.username == bindparam('username'))
        .group_by(Author.author_name)
    ).subquery()

    top_auths = (
        select(author_count.c.author_name,author_count.c.author_count)
        .where(author_count.c.author_count == select(func.max(author_count.c.author_count)).scalar_subquery())
    )

    with db.session() as session:
        results = session.execute(top_auths, {'username': input}).all()

    authors = []
    for d in results:
        a = {
            'author_name': d.author_name,
            'count': d.author_count
        }
        authors.append(a)

    report['top_author'] = authors


    # top genre
    genre_count = (
        select(Genre.genre,func.count(Bookshelf.book_id).label('genre_count'))
        .join(Book, Book.genre_id == Genre.genre_id)
        .join(Bookshelf, Book.book_id == Bookshelf.book_id)
        .where(Bookshelf.reading_status == 'Read',Bookshelf.username == bindparam('username'))
        .group_by(Genre.genre)
    ).subquery()

    top_genres = (
        select(genre_count.c.genre,genre_count.c.genre_count)
        .where(genre_count.c.genre_count == select(func.max(genre_count.c.genre_count)).scalar_subquery())
    )

    with db.session() as session:
        results = session.execute(top_genres, {'username': input}).all()
    
    genres = []
    for d in results:
        g = {
            'genre': d.genre,
            'count': d.genre_count
        }
        genres.append(g)

    report['top_genre'] = genres

    # avg rating
    avg_rating = (
            select(func.avg(Bookshelf.rating))
            .where(Bookshelf.username == bindparam('username'),Bookshelf.reading_status == 'Read')
        )

    with db.session() as session:
        result = session.execute(avg_rating, {'username': input}).scalar()

    report['avg_rating'] = round(result, 2)

    return report

@app.route('/addbook', methods=['POST'])
def addbook():
    data = request.json

    new_row = Bookshelf(username=data['user'], book_id=data['book']['book_id'], rating=None, reading_status='TBR')

    db.session.add(new_row)
    db.session.commit()
    return jsonify("success")

    
@app.route('/deletebook', methods=['POST'])
def deletebook():
    print(request.json)
    data = request.json

    book = Bookshelf.query.filter(Bookshelf.username == data['user'], Bookshelf.book_id==data['book']['book_id']).first()
    db.session.delete(book)
    db.session.commit()
    return jsonify("success")

@app.route('/updatebook', methods=['POST'])
def updatebook():
    print(request.json)
    data = request.json

    book = Bookshelf.query.filter(Bookshelf.username == data['user'], Bookshelf.book_id==data['book']['book_id']).first()
    if data['book']['reading_status'] == 'Read':
        book.rating = data['book']['rating']
    else:
        book.rating = None

    book.reading_status = data['book']['reading_status']

    db.session.commit()
    return jsonify("success")



@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

if __name__ == "__main__":
    app.run(debug=True)