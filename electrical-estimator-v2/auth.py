from functools import wraps
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash
from werkzeug.security import generate_password_hash

from flask import Blueprint
from flask import flash
from flask import redirect
from flask import render_template
from flask import request
from flask import session
from flask import url_for

import models
from database import db # Ensure this import is correct


bp = Blueprint("auth", __name__, url_prefix="/auth")


def login_required(f):
    """
    Decorate routes to require login.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect(url_for("auth.login"))
        return f(*args, **kwargs)

    return decorated_function


@bp.route("/register", methods=["GET", "POST"])
def register():
    """Register a new user."""
    if request.method == "POST":      
        email = request.form.get("email")
        username = request.form.get("username")
        password = request.form.get("password")
        confirmation = request.form.get("confirmation")
        error = None

        if not email:
            error = "Email is required"
        elif not username:
            error = "Username is required"
        elif not password:
            error = "Password is required"
        elif not confirmation:
            error = "Confirmation is required"
        elif password != confirmation:
            error = "Passwords do not match"

        # Hash the password
        hashed_password = generate_password_hash(password)

        if error is None:
            try:
                new_user = models.User(
                    email=email,
                    username=username,
                    password=hashed_password
                )
                db.session.add(new_user)
                db.session.commit()
            except IntegrityError:
                error = f"Email {email} is already registered."
                db.session.rollback()  # Rollback the session to avoid leaving it in an inconsistent state
            except Exception as e:
                error = f"An error occurred: {str(e)}"
                db.session.rollback()  # Rollback the session
            else:
                # Log user in (keeps track of which user is logged in)
                session["user_id"] = new_user.id

                # Confirm registration
                flash("Your details have been added successfully!", "primary")
                # Success, go to the login page.
                return redirect(url_for("auth.login"))

        flash(error, "danger")

    return render_template("auth/register.html")


@bp.route("/login", methods=("GET", "POST"))
def login():
    """Log in a registered user by adding the user id to the session."""
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        error = None

        if not email:
            error = "Email is required"
        elif not password:
            error = "Password is required"

        if error is None:
            user = db.session.query(models.User).filter_by(email=email).first()

            if user is None:
                error = "Invalid Credentials. Have you already Sign Up?" 
            elif not check_password_hash(user.password, password):
                error = "Invalid Credentials."
                
            if error is None:
                # Store the user id in a new session and return to the index
                session.clear()
                session["user_id"] = user.id
                return redirect(url_for("index"))

        flash(error, "danger")

    return render_template("auth/login.html")


@bp.route("/logout")
def logout():
    """Clear the current session, including the stored user id."""
    session.clear()
    return redirect(url_for("index"))