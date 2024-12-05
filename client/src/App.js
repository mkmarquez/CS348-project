import React, { useState, useEffect } from 'react'
import './App.css';
function App() {

  const [books, setBooks] = useState([{}])
  const [allBooks, setAllBooks] = useState([{}])
  const [selectedValue, setSelectedValue] = useState(0);
  const [user, setUser] = useState('');
  const [loggedIn, setLoggedIn] = useState(false)
  const [action, setAction] = useState('')
  const [userReport, setUserReport] = useState({})
  const [pass, setPass] = useState('')
  const [updatedStatus, setUpdatedStatus] = useState('')
  const [updatedRating, setUpdatedRating] = useState(0)
  const [currBook, setCurrBook] = useState({})
  const [addedBook, setAddedBook] = useState('')

  const ratings = [1, 2, 3, 4, 5]

  useEffect(() => {
    fetch("/getallbooks", {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(
      res => res.json()
    ).then(
      // function for setting drop down lists of books
      // handleGetList sets "books" to books in users shelf
      // anytime "books" is changed, this runs to get all books from db then create var
      // with books that are not in that user's db for them to have the option to add
      bookslist => {
        let alluserbookids = []
        books.forEach(book => {
          alluserbookids.push(book.book_id)
        })
        let difference = []
        bookslist.forEach(book => {
          if (!alluserbookids.includes(book.book_id)) {
            difference.push(book)
          }
        })
        console.log(difference)
        setAllBooks(difference)
        setAddedBook(difference[0])
        setCurrBook(books[0])
      }
    )
  }, [books])

  useEffect(() => {
      const b = currBook
      console.log(currBook)
      setUpdatedRating(b.rating);
      setUpdatedStatus(b.reading_status);
      console.log(updatedRating, updatedStatus)
    
  }, [currBook]);

  const handleLogin = (event) => {
    event.preventDefault();
    fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: user, password: pass })
    }).then(
      res => res.json()
    ).then(
      code => {
        if (code === 'logged in') {
          setLoggedIn(true)
        }
        else {
          alert('Incorrect username or password')
          setUser('')
          setPass('')
        }
      }
    )

  }

  const handleGetList = () => {
    fetch("/getbooks", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user)
    }).then(
      res => {return res.json();}
    ).then(
      books => {
        console.log(books)
        setBooks(books)
        setAction('update')
        setSelectedValue(0)
      }
    )
  }

  const handleGetReport = () => {

    fetch("/getreport", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    }).then(
      res => res.json()
    ).then(
      userReport => {
        setUserReport(userReport)
        console.log(userReport.books)
        setAction('report')
      }
    )
  }

  const handlePickBook = (e) => {
    const value = e.target.value;
    setSelectedValue(value); // Update the selected value
    const selectedBook = books.find(map => map.book_id == value); // Use the new value directly
    setCurrBook(selectedBook); // Update the current book

  }

  const handlePickNewBook = (e) => {
    const value = e.target.value;
    console.log(value)
    //setAddedBook(value); // Update the selected value
    const selectedBook = allBooks.find(map => map.book_id == value); // Use the new value directly
    //setCurrBook(selectedBook); // Update the current book
    setAddedBook(selectedBook)

  }

  const addNewBook = () => {
    fetch("/addbook", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ book: addedBook, user: user })
    }).then(
      res => {return res.json();}
    ).then(
      code => {
        if (code == 'success') {
          console.log("HERE")
          let dict = books
          console.log(books)
          dict.push(addedBook)
          setBooks(dict)
          setAction('')
        }

      }
    )
  }

  const deleteFromShelf = () => {

    console.log("TO DELETE", currBook)

    fetch("/deletebook", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ book: currBook, user: user })
    }).then(
      res => {return res.json();}
    ).then(
      code => {
        if (code == 'success') {
          console.log("HERE")
          let dict = books
          console.log(books)
          dict.pop(addedBook)
          setBooks(dict)
          setAction('')
        }

      }
    )

  }

  const updateBook = () => {
    console.log("UDPATE", currBook, updatedRating, updatedStatus)
    let b = currBook
    if (updatedStatus == 'Read' && updatedRating == null) {
      b.rating = 1
    } else {
      b.rating = updatedRating
    }
    b.reading_status = updatedStatus

    fetch("/updatebook", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ book: b, user: user })
    }).then(
      res => {return res.json();}
    ).then(
      code => {
        if (code == 'success') {
          console.log("HERE")
          let dict = books
          console.log(books)
          dict.pop(addedBook)
          setBooks(dict)
          setAction('')
        }

      }
    )

  }

  return (
    <div>
      <h1>Welcome to your bookshelf! </h1>
      <br />
      {!loggedIn && <>
        <form onSubmit={handleLogin}>
          <label>Username:
            <input
              type="username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
            />
          </label>
          <label>Password:
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </label>
          <br />
          <input type="submit" />
        </form>
      </>}

      {
        loggedIn && action === '' &&
        <>
          <h3>Do you want to update your bookshelf or see your report?</h3>
          <button onClick={handleGetList}>Update Bookshelf</button>
          <button onClick={handleGetReport}>See Report</button>
        </>
      }

      {loggedIn && action === 'update' && <>
        <h3>Which book do you want to update?</h3>
        <select value={selectedValue} onChange={handlePickBook} defaultValue={books[0]}>
          {console.log(books[0])}
          {books.map((book) => (
            <option key={book.book_id} value={book.book_id}>
              {book.title} by {book.author_name}
            </option>
          ))}
        </select>
        <button onClick={() => { setAction('updateSelected') }}>Update this book</button>
        <h3>Add a new book to your bookshelf?</h3>
        <select value={addedBook} onChange={handlePickNewBook} defaultValue={allBooks[0].book_id}>
          {allBooks.map((book) => (
            <option key={book.book_id} value={book.book_id}>
              {book.title} by {book.author_name}
            </option>
          ))}
        </select>
        <button onClick={addNewBook}>Add this book</button>
      </>
      }

      {loggedIn && action === 'updateSelected' && <>
        <h3>Updating {currBook.title} by {currBook.author_name}</h3>
        <p>Status</p>
        <select value={updatedStatus} onChange={(e) => setUpdatedStatus(e.target.value)} >
          <option value={'TBR'}>TBR</option>
          <option value={'Read'}>Read</option>
          <option value={'DNF'}>DNF</option>
        </select>

        {updatedStatus === 'Read' && <>
          <p>Rating</p>
          <select value={updatedRating} onChange={(e) => setUpdatedRating(e.target.value)} >
            {
              ratings.map((rating) => (
                <option key={rating} value={rating}>{rating}</option>
              ))
            }
          </select>
        </>}

        < br />

        <button onClick={updateBook}>Submit Changes</button>
        <br/>
        <button onClick={deleteFromShelf}>Delete This Book From Your Bookshelf</button>

      </>
      }

      {
        loggedIn && action === 'report' &&
        <>
          <h3>Here is your reading report!</h3>
          <h4>Your Top Read Author:</h4>
          {userReport.top_author.map((author) => (
            <p key={author} value={author}>{author['author_name']} - {author['count']} total books</p>
          ))}
          <h4>Your Top Read Genre:</h4>
          {userReport.top_genre.map((genre) => (
            <p key={genre} value={genre}>{genre['genre']} - {genre['count']} total books</p>
          ))}
          <h4>Your Average Rating:</h4>
          <p>{userReport.avg_rating} / 5</p>
          <h4>All {userReport.books.length} books</h4>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Reading Status</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {
                userReport.books.map((book) => (
                  <tr key={book.book_id} value={book.book_id}>
                    <td>{book.title}</td>
                    <td>{book.author_name}</td>
                    <td>{book.reading_status}</td>
                    <td>{book.rating}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>

        </>
      }

      <br />
      <br />
      {
        loggedIn && <>
          <button onClick={() => { setLoggedIn(false); setUser(''); setAction(''); setPass(''); }}>Logout</button>
          {action !== '' && <><button onClick={() => { setAction('') }}>Back</button></>}
        </>
      }

    </div>
  )
}

export default App