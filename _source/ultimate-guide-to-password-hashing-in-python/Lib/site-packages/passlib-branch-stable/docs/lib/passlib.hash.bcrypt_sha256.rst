==================================================================
:class:`passlib.hash.bcrypt_sha256` - BCrypt+SHA256
==================================================================

.. versionadded:: 1.6.2

.. currentmodule:: passlib.hash

BCrypt was developed to replace :class:`~passlib.hash.md5_crypt` for BSD systems.
It uses a modified version of the Blowfish stream cipher.
It does, however, truncate passwords to 72 bytes, and some other minor quirks
(see :ref:`BCrypt Password Truncation <bcrypt-password-truncation>` for details).
This class works around that issue by first running the password through HMAC-SHA2-256.
This class can be used directly as follows::

    >>> from passlib.hash import bcrypt_sha256

    >>> # generate new salt, hash password
    >>> h = bcrypt_sha256.hash("password")
    >>> h
    '$bcrypt-sha256$v=2,t=2b,r=12$n79VH.0Q2TMWmt3Oqt9uku$Kq4Noyk3094Y2QlB8NdRT8SvGiI4ft2'

    >>> # the same, but with an explicit number of rounds
    >>> bcrypt_sha256.using(rounds=13).hash("password")
    '$bcrypt-sha256$v=2,t=2b,r=13$AmytCA45b12VeVg0YdDT3.$IZTbbJKgJlD5IJoCWhuDUqYjnJwNPlO'

    >>> # verify password
    >>> bcrypt_sha256.verify("password", h)
    True
    >>> bcrypt_sha256.verify("wrong", h)
    False

.. note::

    It is strongly recommended that you install
    `bcrypt <https://pypi.python.org/pypi/bcrypt>`_
    when using this hash. See :doc:`passlib.hash.bcrypt` for more details.

Interface
=========
.. autoclass:: bcrypt_sha256()

Format
======
Bcrypt-SHA256 is compatible with the :ref:`modular-crypt-format`, and uses ``$bcrypt-sha256$`` as the identifying prefix
for all it's strings.
An example hash (of ``password``) is:

  ``$bcrypt-sha256$v=2,t=2b,r=12$n79VH.0Q2TMWmt3Oqt9uku$Kq4Noyk3094Y2QlB8NdRT8SvGiI4ft2``

Version 1 of this format had the format :samp:`$bcrypt-sha256${type},{rounds}${salt}${digest}`.
Passlib 1.7.3 introduced version 2 of this format, which changed the algorithm slightly (see below),
and adjusted the format to indicate a version: :samp:`$bcrypt-sha256$v=2,t={type},r={rounds}${salt}${digest}`, where:

* :samp:`{type}` is the BCrypt variant in use (always ``2b`` under version 2; though ``2a`` was allowed under version 1).
* :samp:`{rounds}` is a cost parameter, encoded as decimal integer,
  which determines the number of iterations used via :samp:`{iterations}=2**{rounds}` (rounds is 12 in the example).
* :samp:`{salt}` is a 22 character salt string, using the characters in the regexp range ``[./A-Za-z0-9]`` (``n79VH.0Q2TMWmt3Oqt9uku`` in the example).
* :samp:`{digest}` is a 31 character digest, using the same characters as the salt (``Kq4Noyk3094Y2QlB8NdRT8SvGiI4ft2`` in the example).

Algorithm
=========
The algorithm this hash uses is as follows:

* first the password is encoded to ``UTF-8`` if not already encoded.

* the next step is to hash the password before handing it off to bcrypt:

    - Under version 2 of this algorithm (the default as of  passlib 1.7.3), the password is run
      through HMAC-SHA2-256, with the HMAC key set to the bcrypt salt (encoded as a 22 character ascii salt string).

    - Under the older version 1 of this algorithm, the password was instead run through plain SHA2-256.

    In either case, this generates a 32 byte digest.

* this hash is then encoded using base64, resulting in a 44-byte result
  (including the trailing padding ``=``). For the example ``"password"`` and the salt ``"n79VH.0Q2TMWmt3Oqt9uku"``,
  the output from this stage would be ``b"7CwRr5rxo2JZcVmSDAi/2JPTkvkAdNy20Cz2LwYC0fw="`` (for version 2).

* this base64 string is then passed on to the underlying bcrypt algorithm
  as the new password to be hashed. See :doc:`passlib.hash.bcrypt` for details
  on it's operation.  For the example in the prior line, the resulting
  bcrypt digest component would be ``"Kq4Noyk3094Y2QlB8NdRT8SvGiI4ft2"``.
