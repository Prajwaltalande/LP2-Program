from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
import requests
from dateutil import parser

app = Flask(__name__)

# SQLAlchemy configuration for SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///transactions.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Add this line to avoid warning
db = SQLAlchemy(app)

# Transaction Model
class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    description = db.Column(db.String(200))
    price = db.Column(db.Float)
    category = db.Column(db.String(50))
    sold = db.Column(db.Boolean)
    date_of_sale = db.Column(db.DateTime)

    def __repr__(self):
        return f"Transaction('{self.title}', '{self.date_of_sale}')"

# Create the database
with app.app_context():
    db.create_all()

# Initialize the database with the fetched data
def initialize_database(data):
    for item in data:
        # Use dateutil parser to automatically handle various datetime formats
        date_of_sale = parser.isoparse(item['dateOfSale'])

        # Create a new Transaction object for each record        
        transaction = Transaction(
            title=item['title'],
            description=item['description'],
            price=item['price'],
            category=item['category'],
            sold=item['sold'],
            date_of_sale=date_of_sale
        )

        # Add to the session and commit to the database
        db.session.add(transaction)
    db.session.commit()

# Fetch data from the API and initialize the database
def fetch_and_initialize_database():
    DATA_URL = "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    response = requests.get(DATA_URL)
    
    # Check if the request was successful
    if response.status_code == 200:
        data = response.json()  # Parse JSON data
        initialize_database(data)  # Call the initialize_database function with fetched data
    else:
        print(f"Error fetching data: {response.status_code}")

# Initialize the database with seed data
with app.app_context():
    fetch_and_initialize_database()

# Define route to get transactions
@app.route('/transactions', methods=['GET'])
def get_transactions():
    month = int(request.args.get('month', 1))  # Default to January
    search = request.args.get('search', '').lower()
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))

    # Filter by month
    filtered_transactions = Transaction.query.filter(
        db.extract('month', Transaction.date_of_sale) == month
    )

    # Apply search filters if provided
    if search:
        filtered_transactions = filtered_transactions.filter(
            (Transaction.title.ilike(f'%{search}%')) |
            (Transaction.description.ilike(f'%{search}%')) |
            (Transaction.price.ilike(f'%{search}%'))
        )

    # Pagination
    transactions = filtered_transactions.paginate(page, per_page, False).items

    # Convert to a list of dictionaries (JSON format)
    result = [{
        "id": t.id,
        "title": t.title,
        "description": t.description,
        "price": t.price,
        "category": t.category,
        "sold": t.sold,
        "dateOfSale": t.date_of_sale.strftime('%Y-%m-%d')
    } for t in transactions]

    return jsonify(result)

# Run the app
if __name__ == '__main__':
    app.run(debug=True)